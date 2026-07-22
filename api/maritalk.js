function studentContext(student = {}) {
  return [
    `Nome usado no protótipo: ${student.name || "Estudante"}`,
    `Idade: ${student.age || "não informada"}`,
    `Curso/turma: ${student.course || "não informado"} - ${student.group || "não informada"}`,
    `Diagnóstico/contexto pedagógico: ${student.diagnosis || "não informado"}`,
    `Histórico escolar: ${student.history || "não informado"}`,
    `Necessidades educacionais: ${student.needs || "não informadas"}`,
    `Habilidades e interesses: ${student.skills || "não informados"}`,
    `Dificuldades observadas: ${student.difficulties || "não informadas"}`,
    `Adaptações recomendadas: ${student.accommodations || "não informadas"}`,
    `Observações: ${student.notes || "sem observações"}`
  ].join("\n");
}

function buildPeiPrompt(body = {}) {
  return `
Você é um assistente pedagógico especializado em Educação Inclusiva e deve apoiar um professor na elaboração de um PEI.

Use linguagem profissional, objetiva, respeitosa e aplicável em escola pública brasileira.
Não invente diagnósticos clínicos. Transforme as informações do estudante em orientações pedagógicas práticas.
Preserve exatamente os quatro blocos abaixo e responda somente com esses blocos:

07 - Objetivos Específicos:
09 - Metodologia:
10 - Avaliação:
11 - Resultados Esperados:

Dados do estudante:
${studentContext(body.student)}

Professor(a): ${body.teacherName || "não informado"}
Componente curricular: ${body.subject || "não informado"}
08 - Conteudos Programaticos:
${body.contents || "não informado"}

Regras:
- Em objetivos, escreva de 3 a 5 objetivos mensuraveis e realistas.
- Em metodologia, detalhe estrategias, adaptacoes, mediacao, recursos e organizacao da aula.
- Em avaliacao, inclua criterios, evidencias e flexibilizacoes sem reduzir a expectativa pedagogica.
- Em resultados esperados, descreva progresso observavel de autonomia, participacao e aprendizagem.
`.trim();
}

function buildActivitiesPrompt(body = {}) {
  return `
Você é um assistente pedagógico especializado em atividades adaptadas para Educação Inclusiva.

Crie uma sequencia de atividades adaptadas com base no perfil do estudante.
Use linguagem profissional, objetiva e diretamente aplicavel pelo professor.
Responda somente com o bloco abaixo:

12 - Sugestões de Atividades:

Dados do estudante:
${studentContext(body.student)}

Professor(a): ${body.teacherName || "não informado"}
Componente curricular: ${body.subject || "não informado"}
Foco pedagógico: ${body.focus || "não informado"}
Conteudos base:
${body.contents || "não informado"}

Regras:
- Crie de 6 a 10 atividades.
- Cada atividade deve conter: Atividade, Objetivo, Materiais, Como aplicar, Adaptacoes/apoios e Evidencia para avaliar.
- Considere as necessidades, habilidades, dificuldades e adaptacoes do estudante.
- Evite generalidades; as atividades precisam ser praticas e executaveis.
`.trim();
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido" });
  }

  const apiKey = process.env.MARITALK_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "MARITALK_API_KEY não configurada. O protótipo usará a geração local de demonstração."
    });
  }

  try {
    const body = await readBody(req);
    const prompt = body.type === "activities" ? buildActivitiesPrompt(body) : buildPeiPrompt(body);

    const response = await fetch("https://chat.maritaca.ai/api/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.MARITALK_MODEL || "sabiazinho-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: body.type === "activities" ? 5000 : 4000
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      return res.status(response.status).json({
        error: "Falha ao consultar MariTalk.",
        detail: detail.slice(0, 500)
      });
    }

    const json = await response.json();
    const text = json?.choices?.[0]?.message?.content || "";

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao gerar resposta com MariTalk." });
  }
};

