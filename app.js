const STORAGE_KEY = "pei-inteligente-prototipo-v2";

const seedData = {
  students: [
    {
      id: "student-perfil-a",
      name: "Estudante A - perfil anonimizado",
      age: "18",
      course: "Ensino Médio Técnico Integrado",
      group: "3o ano - turma demonstrativa",
      diagnosis: "Perfil pedagógico anonimizado a partir do Sheets: estudante com necessidades de apoio em linguagem funcional, atenção, organização executiva e processamento de informações abstratas. Dados pessoais e identificadores foram removidos para uso público.",
      history: "Trajetória escolar com necessidade de mediação pedagógica, adaptação de atividades, apoio à leitura, escrita, compreensão textual e raciocínio lógico-matemático. Apresenta melhor resposta quando as propostas são objetivas, previsíveis, contextualizadas e visualmente estruturadas.",
      needs: "Instruções claras, objetivas e segmentadas; apoio visual constante; fragmentação de comandos extensos; ampliação de tempo; mediação durante atividades e avaliações; redução de sobrecarga sensorial; contextualização concreta dos conteúdos; acompanhamento pelo AEE quando necessário.",
      skills: "Interesse por atividades visuais, práticas e contextualizadas; boa resposta a reforços positivos; facilidade maior com recursos tecnológicos, exemplos concretos e propostas organizadas por etapas. Interesses como arte, música, narrativas fantásticas e tecnologia podem favorecer engajamento.",
      difficulties: "Dificuldades em interpretação textual, organização da linguagem expressiva, produção escrita com sequência lógica, memória de trabalho, atenção sustentada, abstração e resolução de problemas com múltiplas etapas.",
      accommodations: "Linguagem clara e segmentada, repetição e confirmação de compreensão, apoio visual, flexibilização linguística, atividades em pequenas etapas, tempo ampliado, redução quantitativa de exercícios repetitivos, exemplos concretos, recursos tecnológicos e possibilidade de resposta oral, visual ou mediada.",
      notes: "Registro criado para proposta pública. Não contém nome real, telefone, responsável, data de nascimento ou qualquer dado identificador do Sheets original.",
      teacherIds: ["teacher-demo"],
      status: "Em acompanhamento"
    }
  ],
  teachers: [
    {
      id: "teacher-demo",
      name: "Professor Demonstrativo",
      area: "Matematica",
      email: "professor.demo@example.com",
      phone: "(00) 00000-0000"
    }
  ],
  peis: [],
  activities: []
};

const state = {
  role: null,
  selectedRole: "admin",
  view: "dashboard",
  teacherId: "teacher-demo",
  selectedStudentId: "student-perfil-a",
  peiTab: "edit"
};

const navItems = {
  admin: [
    ["dashboard", "Visão geral"],
    ["students", "Alunos"],
    ["teachers", "Professores"],
    ["links", "Vínculos"]
  ],
  teacher: [
    ["teacherHome", "Minha turma"],
    ["pei", "Criar PEI"],
    ["activities", "Atividades adaptadas"]
  ]
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return clone(seedData);
    const parsed = JSON.parse(saved);
    return {
      students: Array.isArray(parsed.students) ? parsed.students : clone(seedData.students),
      teachers: Array.isArray(parsed.teachers) ? parsed.teachers : clone(seedData.teachers),
      peis: Array.isArray(parsed.peis) ? parsed.peis : [],
      activities: Array.isArray(parsed.activities) ? parsed.activities : []
    };
  } catch {
    return clone(seedData);
  }
}

let data = loadData();

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function resetData() {
  data = clone(seedData);
  saveData();
  state.teacherId = data.teachers[0]?.id || "";
  state.selectedStudentId = data.students[0]?.id || "";
  render();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function getTeacherName(id) {
  return data.teachers.find((teacher) => teacher.id === id)?.name || "Sem professor vinculado";
}

function getStudent(id) {
  return data.students.find((student) => student.id === id) || data.students[0];
}

function getTeacherStudents() {
  return data.students.filter((student) => student.teacherIds?.includes(state.teacherId));
}

function latestPeiFor(studentId) {
  return data.peis.filter((pei) => pei.studentId === studentId).at(-1);
}

function latestActivityFor(studentId) {
  return data.activities.filter((activity) => activity.studentId === studentId).at(-1);
}

function setRoleChoice(role) {
  state.selectedRole = role;
  $$("[data-role-option]").forEach((button) => {
    const active = button.dataset.roleOption === role;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  $("#login-user").value = role === "admin" ? "administrador" : "professor";
  $("#login-pass").value = "123456";
}

function showLoginError(message) {
  const error = $("#login-error");
  error.textContent = message;
  error.hidden = false;
}

function login(role, user, password) {
  const normalized = user.trim().toLowerCase();
  const expected = role === "admin" ? ["administrador", "admin"] : ["professor", "docente"];

  if (!expected.includes(normalized) || password !== "123456") {
    showLoginError("Usuário ou senha inválidos para o perfil selecionado.");
    return;
  }

  state.role = role;
  state.view = role === "admin" ? "dashboard" : "teacherHome";
  state.teacherId = data.teachers[0]?.id || "";
  state.selectedStudentId = (role === "teacher" ? getTeacherStudents()[0]?.id : data.students[0]?.id) || "";

  $("#login-screen").hidden = true;
  $("#app-shell").hidden = false;
  $("#login-error").hidden = true;
  render();
}

function logout() {
  state.role = null;
  $("#app-shell").hidden = true;
  $("#login-screen").hidden = false;
}

function render() {
  if (!state.role) return;
  renderShell();

  const views = {
    dashboard: renderAdminDashboard,
    students: renderStudents,
    teachers: renderTeachers,
    links: renderLinks,
    teacherHome: renderTeacherHome,
    pei: renderPei,
    activities: renderActivities
  };

  const renderer = views[state.view] || (state.role === "admin" ? renderAdminDashboard : renderTeacherHome);
  $("#app-content").innerHTML = renderer();
  bindViewEvents();
  $("#app-content").focus({ preventScroll: true });
}

function renderShell() {
  const isAdmin = state.role === "admin";
  $("#session-label").textContent = isAdmin ? "Perfil administrador" : `${getTeacherName(state.teacherId)} · Professor`;
  $("#module-title").textContent = isAdmin ? "Administrador" : "Professor";
  $("#module-description").textContent = isAdmin
    ? "Direção, coordenação e professor de AEE."
    : "Criação de PEI e atividades adaptadas.";

  $("#app-nav").innerHTML = navItems[state.role]
    .map(([view, label]) => {
      const active = state.view === view ? "is-active" : "";
      return `<button class="${active}" type="button" data-view="${view}">${label}<span aria-hidden="true">›</span></button>`;
    })
    .join("");
}

function renderNotice() {
  return `
    <div class="notice">
      <strong>Ambiente de demonstração</strong>
      <span>Use apenas dados fictícios ou anonimizados. As informações ficam salvas somente neste navegador.</span>
    </div>
  `;
}

function renderAdminDashboard() {
  const linked = data.students.filter((student) => student.teacherIds?.length).length;
  const peis = data.peis.length;
  const activities = data.activities.length;

  return `
    <div class="view-title">
      <div>
        <p class="section-kicker">Painel administrador</p>
        <h1>Visão geral da inclusão.</h1>
        <p>Acompanhe estudantes cadastrados, professores vinculados e registros pedagógicos em um só lugar.</p>
      </div>
      <div class="actions-row">
        <button class="button button-secondary" type="button" data-view-shortcut="students">Cadastrar aluno</button>
        <button class="button button-primary" type="button" data-view-shortcut="teachers">Cadastrar professor</button>
      </div>
    </div>
    ${renderNotice()}
    <section class="grid four">
      <article class="stat-card"><span>Alunos da inclusão</span><strong>${data.students.length}</strong><p>Inclui o aluno fictício inicial.</p></article>
      <article class="stat-card"><span>Professores</span><strong>${data.teachers.length}</strong><p>Docentes disponíveis para vínculo.</p></article>
      <article class="stat-card"><span>Alunos vinculados</span><strong>${linked}</strong><p>Com ao menos um professor associado.</p></article>
      <article class="stat-card"><span>Registros pedagógicos</span><strong>${peis + activities}</strong><p>PEIs e atividades salvos neste ambiente.</p></article>
    </section>
    <section class="panel">
      <div class="panel-title">
        <div>
          <h2>Alunos em acompanhamento</h2>
          <p>Resumo rápido dos estudantes cadastrados.</p>
        </div>
      </div>
      ${renderStudentCards(data.students)}
    </section>
  `;
}

function renderStudentCards(students) {
  if (!students.length) {
    return `<div class="empty-state">Nenhum aluno cadastrado ainda.</div>`;
  }

  return `
    <div class="grid two">
      ${students
        .map((student) => {
          const teachers = student.teacherIds?.map(getTeacherName).join(", ") || "Sem vínculo";
          const pei = latestPeiFor(student.id);
          return `
            <article class="student-card">
              <header>
                <div>
                  <h3>${escapeHtml(student.name)}</h3>
                  <p>${escapeHtml(student.course)} - ${escapeHtml(student.group)}</p>
                </div>
                <span class="tag">${escapeHtml(student.status || "Cadastro")}</span>
              </header>
              <div class="meta-list">
                <span><b>Necessidades:</b> ${escapeHtml(student.needs)}</span>
                <span><b>Professor:</b> ${escapeHtml(teachers)}</span>
                <span><b>PEI:</b> ${pei ? `Criado em ${escapeHtml(pei.date)}` : "Ainda não criado"}</span>
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderStudents() {
  return `
    <div class="view-title">
      <div>
        <p class="section-kicker">Cadastro de alunos</p>
        <h1>Alunos da inclusão.</h1>
        <p>Inclua estudantes, registre necessidades educacionais e mantenha o contexto pedagógico acessível para o professor.</p>
      </div>
    </div>
    ${renderNotice()}
    <section class="panel">
      <div class="panel-title">
        <div>
          <h2>Novo aluno</h2>
          <p>Os dados alimentam o PEI e as atividades adaptadas no módulo do professor.</p>
        </div>
      </div>
      <form class="data-form" id="student-form">
        <div class="field-grid">
          <label>Nome do estudante<input name="name" required placeholder="Ex.: Maria Eduarda Silva" /></label>
          <label>Idade<input name="age" required placeholder="Ex.: 14" /></label>
          <label>Curso<input name="course" required placeholder="Ex.: 1o ano do Ensino Médio Integrado" /></label>
          <label>Turma<input name="group" required placeholder="Ex.: Turma 1B" /></label>
          <label>Diagnóstico ou hipótese registrada<textarea name="diagnosis" placeholder="Não invente diagnósticos; registre apenas informações oficiais ou observadas."></textarea></label>
          <label>Histórico<textarea name="history" placeholder="Origem até a atualidade, informações escolares e familiares relevantes."></textarea></label>
          <label>Necessidades educacionais<textarea name="needs" required></textarea></label>
          <label>Conhecimentos e habilidades<textarea name="skills" required></textarea></label>
          <label>Dificuldades apresentadas<textarea name="difficulties" required></textarea></label>
          <label>Adaptações razoáveis e acessibilidades<textarea name="accommodations" required></textarea></label>
          <label class="wide">Observações<textarea name="notes"></textarea></label>
          <label>Vincular professor
            <select name="teacherId">
              <option value="">Sem vínculo inicial</option>
              ${data.teachers.map((teacher) => `<option value="${teacher.id}">${escapeHtml(teacher.name)} - ${escapeHtml(teacher.area)}</option>`).join("")}
            </select>
          </label>
          <label>Status
            <select name="status">
              <option>Em acompanhamento</option>
              <option>Em elaboração de PEI</option>
              <option>Plano revisado</option>
            </select>
          </label>
        </div>
        <button class="button button-primary" type="submit">Cadastrar aluno</button>
      </form>
    </section>
    <section class="panel">
      <div class="panel-title">
        <div>
          <h2>Todos os alunos cadastrados</h2>
          <p>Lista visível para o administrador.</p>
        </div>
      </div>
      ${renderStudentCards(data.students)}
    </section>
  `;
}

function renderTeachers() {
  return `
    <div class="view-title">
      <div>
        <p class="section-kicker">Cadastro de professores</p>
        <h1>Professores e áreas.</h1>
        <p>Cadastre docentes que poderão receber alunos vinculados pelo administrador.</p>
      </div>
    </div>
    ${renderNotice()}
    <section class="panel">
      <div class="panel-title">
        <div>
          <h2>Novo professor</h2>
          <p>O vínculo com alunos é feito na próxima tela.</p>
        </div>
      </div>
      <form class="data-form" id="teacher-form">
        <div class="field-grid">
          <label>Nome do professor<input name="name" required placeholder="Ex.: Fernanda Costa" /></label>
          <label>Área ou componente<input name="area" required placeholder="Ex.: Língua Portuguesa" /></label>
          <label>E-mail<input name="email" type="email" placeholder="professor@escola.edu.br" /></label>
          <label>Telefone<input name="phone" placeholder="(00) 00000-0000" /></label>
        </div>
        <button class="button button-primary" type="submit">Cadastrar professor</button>
      </form>
    </section>
    <section class="panel">
      <div class="panel-title">
        <div>
          <h2>Professores cadastrados</h2>
          <p>Resumo dos docentes disponíveis para acompanhamento.</p>
        </div>
      </div>
      <div class="grid two">
        ${data.teachers
          .map((teacher) => {
            const count = data.students.filter((student) => student.teacherIds?.includes(teacher.id)).length;
            return `
              <article class="teacher-card">
                <header>
                  <div>
                    <h3>${escapeHtml(teacher.name)}</h3>
                    <p>${escapeHtml(teacher.area)}</p>
                  </div>
                  <span class="mini-tag blue">${count} aluno(s)</span>
                </header>
                <div class="meta-list">
                  <span><b>E-mail:</b> ${escapeHtml(teacher.email || "Não informado")}</span>
                  <span><b>Telefone:</b> ${escapeHtml(teacher.phone || "Não informado")}</span>
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderLinks() {
  return `
    <div class="view-title">
      <div>
        <p class="section-kicker">Vínculos</p>
        <h1>Alunos e professores.</h1>
        <p>Defina quais estudantes ficam disponíveis para cada professor no módulo docente.</p>
      </div>
    </div>
    ${renderNotice()}
    <section class="panel">
      <div class="panel-title">
        <div>
          <h2>Criar vínculo</h2>
          <p>O aluno aparecerá na área do professor selecionado.</p>
        </div>
      </div>
      <form class="assignment-row" id="assignment-form">
        <label>Aluno
          <select name="studentId" required>
            ${data.students.map((student) => `<option value="${student.id}">${escapeHtml(student.name)}</option>`).join("")}
          </select>
        </label>
        <label>Professor
          <select name="teacherId" required>
            ${data.teachers.map((teacher) => `<option value="${teacher.id}">${escapeHtml(teacher.name)} - ${escapeHtml(teacher.area)}</option>`).join("")}
          </select>
        </label>
        <button class="button button-primary" type="submit">Vincular</button>
      </form>
    </section>
    <section class="panel">
      <div class="panel-title">
        <div>
          <h2>Mapa atual de vínculos</h2>
          <p>Visão administrativa dos responsáveis pedagógicos por estudante.</p>
        </div>
      </div>
      <div class="table-like">
        ${data.students
          .map((student) => {
            const teachers = student.teacherIds?.map(getTeacherName).join(", ") || "Sem professor vinculado";
            return `
              <article class="record-card">
                <header>
                  <div>
                    <h3>${escapeHtml(student.name)}</h3>
                    <p>${escapeHtml(student.course)} - ${escapeHtml(student.group)}</p>
                  </div>
                  <span class="mini-tag">${escapeHtml(teachers)}</span>
                </header>
              </article>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderTeacherHome() {
  const students = getTeacherStudents();
  return `
    <div class="view-title">
      <div>
        <p class="section-kicker">Painel professor</p>
        <h1>Minha turma da inclusão.</h1>
        <p>Veja os alunos vinculados a este professor e acesse rapidamente os fluxos de PEI e atividades adaptadas.</p>
      </div>
      <div class="actions-row">
        <label>Docente selecionado
          <select data-change-teacher>
            ${data.teachers.map((teacher) => `<option value="${teacher.id}" ${teacher.id === state.teacherId ? "selected" : ""}>${escapeHtml(teacher.name)}</option>`).join("")}
          </select>
        </label>
      </div>
    </div>
    ${renderNotice()}
    <section class="grid three">
      <article class="stat-card"><span>Alunos vinculados</span><strong>${students.length}</strong><p>Disponíveis para este professor.</p></article>
      <article class="stat-card"><span>PEIs salvos</span><strong>${data.peis.filter((pei) => students.some((student) => student.id === pei.studentId)).length}</strong><p>Registros disponíveis neste ambiente.</p></article>
      <article class="stat-card"><span>Atividades</span><strong>${data.activities.filter((activity) => students.some((student) => student.id === activity.studentId)).length}</strong><p>Sequências adaptadas salvas.</p></article>
    </section>
    <section class="panel">
      <div class="panel-title">
        <div>
          <h2>Alunos vinculados</h2>
          <p>Escolha um estudante para elaborar PEI ou atividades.</p>
        </div>
      </div>
      ${students.length ? renderTeacherStudentCards(students) : `<div class="empty-state">Nenhum aluno vinculado a este professor. Acesse o módulo administrador para criar o vínculo.</div>`}
    </section>
  `;
}

function renderTeacherStudentCards(students) {
  return `
    <div class="grid two">
      ${students
        .map((student) => {
          const pei = latestPeiFor(student.id);
          const activity = latestActivityFor(student.id);
          return `
            <article class="student-card">
              <header>
                <div>
                  <h3>${escapeHtml(student.name)}</h3>
                  <p>${escapeHtml(student.course)} - ${escapeHtml(student.group)}</p>
                </div>
                <span class="tag">${escapeHtml(student.status)}</span>
              </header>
              <div class="meta-list">
                <span><b>Necessidades:</b> ${escapeHtml(student.needs)}</span>
                <span><b>PEI:</b> ${pei ? `Salvo em ${escapeHtml(pei.date)}` : "Não iniciado"}</span>
                <span><b>Atividades:</b> ${activity ? `Salvas em ${escapeHtml(activity.date)}` : "Não iniciadas"}</span>
              </div>
              <div class="split-actions">
                <button class="button button-secondary" type="button" data-open-pei="${student.id}">Criar PEI</button>
                <button class="button button-primary" type="button" data-open-activities="${student.id}">Atividades</button>
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderStudentSelect(students) {
  return `
    <label>Aluno
      <select id="student-select">
        ${students.map((student) => `<option value="${student.id}" ${student.id === state.selectedStudentId ? "selected" : ""}>${escapeHtml(student.name)}</option>`).join("")}
      </select>
    </label>
  `;
}

function renderStudentContext(student) {
  if (!student) return `<div class="empty-state">Selecione um aluno para visualizar o contexto.</div>`;
  return `
    <section class="student-context">
      <h3>${escapeHtml(student.name)}</h3>
      <p>${escapeHtml(student.course)} - ${escapeHtml(student.group)} - ${escapeHtml(student.age)} anos</p>
      <div class="context-grid">
        <div><strong>Diagnóstico/contexto</strong><span>${escapeHtml(student.diagnosis || "Não informado")}</span></div>
        <div><strong>Necessidades</strong><span>${escapeHtml(student.needs)}</span></div>
        <div><strong>Habilidades</strong><span>${escapeHtml(student.skills)}</span></div>
        <div><strong>Dificuldades</strong><span>${escapeHtml(student.difficulties)}</span></div>
        <div><strong>Adaptações</strong><span>${escapeHtml(student.accommodations)}</span></div>
        <div><strong>Observações</strong><span>${escapeHtml(student.notes || "Sem observações adicionais.")}</span></div>
      </div>
    </section>
  `;
}

function renderPei() {
  const students = getTeacherStudents();
  if (!students.length) {
    return `
      <div class="view-title">
        <div>
          <p class="section-kicker">Professor</p>
          <h1>Criar PEI do aluno.</h1>
          <p>Este professor ainda não possui alunos vinculados.</p>
        </div>
      </div>
      ${renderNotice()}
      <section class="panel">
        <div class="empty-state">Entre pelo módulo administrador e vincule ao menos um aluno a este professor para liberar a criação de PEI.</div>
      </section>
    `;
  }
  if (!students.some((student) => student.id === state.selectedStudentId)) {
    state.selectedStudentId = students[0]?.id || "";
  }
  const student = getStudent(state.selectedStudentId);
  const latest = latestPeiFor(state.selectedStudentId) || {};

  return `
    <div class="view-title">
      <div>
        <p class="section-kicker">Professor</p>
        <h1>Criar PEI do aluno.</h1>
        <p>Use o contexto pedagógico para elaborar objetivos, estratégias, avaliação e resultados esperados.</p>
      </div>
      <div class="actions-row">${renderStudentSelect(students)}</div>
    </div>
    ${renderNotice()}
    <section class="panel">
      <div class="panel-title">
        <div>
          <h2>Contexto do estudante</h2>
          <p>Informações cadastradas pelo administrador aparecem aqui para orientar o PEI.</p>
        </div>
      </div>
      ${renderStudentContext(student)}
    </section>
    <section class="panel">
      <div class="panel-title">
        <div>
          <h2>Plano Educacional Individualizado</h2>
          <p>Informe o componente e os conteúdos, gere uma primeira versão e revise todos os campos antes de salvar.</p>
        </div>
      </div>
      <div class="model-box">
        <strong>Apoio à elaboração:</strong>
        a sugestão considera necessidades, habilidades, dificuldades, adaptações e conteúdos programáticos. A revisão e a decisão final permanecem com o profissional responsável.
      </div>
      <form class="data-form" id="pei-form">
        <div class="form-stage">
          <div class="form-stage-heading">
            <span>1</span>
            <div><strong>Informações da proposta</strong><small>Dados definidos pelo professor antes da geração.</small></div>
          </div>
          <div class="field-grid">
            <label>Docente<input name="teacherName" value="${escapeHtml(getTeacherName(state.teacherId))}" readonly /></label>
            <label>Componente curricular<input name="subject" value="${escapeHtml(latest.subject || "Matemática")}" required /></label>
            <label class="wide">Conteúdos programáticos<textarea name="contents" required>${escapeHtml(latest.contents || "Funções afins: interpretação de gráficos, relação entre variáveis e resolução de problemas contextualizados.")}</textarea></label>
          </div>
        </div>
        <div class="split-actions form-actions">
          <button class="button button-secondary" type="button" data-generate-pei>Gerar sugestão</button>
          <button class="button button-primary" type="submit">Salvar PEI</button>
          <button class="button button-ghost" type="button" data-pdf-pei>Gerar PDF</button>
        </div>
        <p class="generation-status" data-pei-status aria-live="polite">A geração pode usar o serviço de IA configurado ou o modo demonstrativo local.</p>
        <div class="form-stage generated-stage">
          <div class="form-stage-heading">
            <span>2</span>
            <div><strong>Conteúdo sugerido</strong><small>Revise e edite cada campo antes de salvar ou gerar o PDF.</small></div>
          </div>
          <div class="field-grid">
            <label>Objetivos específicos<textarea name="objectives">${escapeHtml(latest.objectives || "")}</textarea></label>
            <label>Metodologia<textarea name="methodology">${escapeHtml(latest.methodology || "")}</textarea></label>
            <label>Avaliação<textarea name="evaluation">${escapeHtml(latest.evaluation || "")}</textarea></label>
            <label>Resultados esperados<textarea name="results">${escapeHtml(latest.results || "")}</textarea></label>
          </div>
        </div>
      </form>
    </section>
    ${renderPeiHistory(state.selectedStudentId)}
  `;
}

function renderPeiHistory(studentId) {
  const records = data.peis.filter((pei) => pei.studentId === studentId).slice().reverse();
  if (!records.length) return "";
  return `
    <section class="panel">
      <div class="panel-title">
        <div>
          <h2>Histórico de PEIs</h2>
          <p>Registros salvos para este estudante.</p>
        </div>
      </div>
      <div class="grid two">
        ${records
          .map((pei) => `
            <article class="record-card">
              <header>
                <div>
                  <h3>${escapeHtml(pei.subject)}</h3>
                  <p>${escapeHtml(pei.date)} - ${escapeHtml(pei.teacherName)}</p>
                </div>
                <span class="mini-tag">PEI</span>
              </header>
              <p>${escapeHtml(pei.objectives).slice(0, 220)}${pei.objectives.length > 220 ? "..." : ""}</p>
            </article>
          `)
          .join("")}
      </div>
    </section>
  `;
}

function renderActivities() {
  const students = getTeacherStudents();
  if (!students.length) {
    return `
      <div class="view-title">
        <div>
          <p class="section-kicker">Professor</p>
          <h1>Atividades adaptadas.</h1>
          <p>Este professor ainda não possui alunos vinculados.</p>
        </div>
      </div>
      ${renderNotice()}
      <section class="panel">
        <div class="empty-state">Entre pelo módulo administrador e vincule ao menos um aluno a este professor para liberar o gerador de atividades.</div>
      </section>
    `;
  }
  if (!students.some((student) => student.id === state.selectedStudentId)) {
    state.selectedStudentId = students[0]?.id || "";
  }
  const student = getStudent(state.selectedStudentId);
  const latest = latestActivityFor(state.selectedStudentId) || {};

  return `
    <div class="view-title">
      <div>
        <p class="section-kicker">Professor</p>
        <h1>Atividades adaptadas.</h1>
        <p>Transforme objetivos e conteúdos em propostas adaptadas, com apoios e evidências para acompanhamento.</p>
      </div>
      <div class="actions-row">${renderStudentSelect(students)}</div>
    </div>
    ${renderNotice()}
    <section class="panel">
      <div class="panel-title">
        <div>
          <h2>Contexto usado na adaptação</h2>
          <p>As sugestões consideram o cadastro do aluno e as adaptações razoáveis.</p>
        </div>
      </div>
      ${renderStudentContext(student)}
    </section>
    <section class="panel">
      <div class="panel-title">
        <div>
          <h2>Gerador de atividades</h2>
          <p>Gere uma sequência inicial, revise as adaptações e salve a versão adequada para o estudante.</p>
        </div>
      </div>
      <form class="data-form" id="activity-form">
        <div class="form-stage">
          <div class="form-stage-heading">
            <span>1</span>
            <div><strong>Informações da atividade</strong><small>Dados definidos pelo professor antes da geração.</small></div>
          </div>
          <div class="field-grid">
            <label>Docente<input name="teacherName" value="${escapeHtml(getTeacherName(state.teacherId))}" readonly /></label>
            <label>Componente curricular<input name="subject" value="${escapeHtml(latest.subject || "Matemática")}" required /></label>
            <label>Foco da aula<input name="focus" value="${escapeHtml(latest.focus || "Leitura de gráficos e resolução de situações-problema")}" required /></label>
            <label class="wide">Conteúdos base<textarea name="contents" required>${escapeHtml(latest.contents || "Funções afins, interpretação de gráficos, padrões de crescimento e aplicações no cotidiano.")}</textarea></label>
          </div>
        </div>
        <div class="split-actions form-actions">
          <button class="button button-secondary" type="button" data-generate-activities>Gerar sugestões</button>
          <button class="button button-primary" type="submit">Salvar atividades</button>
          <button class="button button-ghost" type="button" data-pdf-activities>Gerar PDF</button>
        </div>
        <p class="generation-status" data-activities-status aria-live="polite">A geração pode usar o serviço de IA configurado ou o modo demonstrativo local.</p>
        <div class="form-stage generated-stage">
          <div class="form-stage-heading">
            <span>2</span>
            <div><strong>Atividades sugeridas</strong><small>Revise e edite o conteúdo antes de salvar ou gerar o PDF.</small></div>
          </div>
          <div class="field-grid">
            <label class="wide">Sugestões de atividades<textarea class="generated-output" name="output">${escapeHtml(latest.output || "")}</textarea></label>
          </div>
        </div>
      </form>
    </section>
    ${renderActivityHistory(state.selectedStudentId)}
  `;
}

function renderActivityHistory(studentId) {
  const records = data.activities.filter((activity) => activity.studentId === studentId).slice().reverse();
  if (!records.length) return "";
  return `
    <section class="panel">
      <div class="panel-title">
        <div>
          <h2>Histórico de atividades</h2>
          <p>Sequências salvas para este estudante.</p>
        </div>
      </div>
      <div class="grid two">
        ${records
          .map((activity) => `
            <article class="record-card">
              <header>
                <div>
                  <h3>${escapeHtml(activity.subject)}</h3>
                  <p>${escapeHtml(activity.date)} - ${escapeHtml(activity.focus)}</p>
                </div>
                <span class="mini-tag blue">Atividades</span>
              </header>
              <p>${escapeHtml(activity.output).slice(0, 220)}${activity.output.length > 220 ? "..." : ""}</p>
            </article>
          `)
          .join("")}
      </div>
    </section>
  `;
}

function generatePei(student, subject, contents) {
  return {
    objectives: `07 - Objetivos Específicos:\n- Interpretar situações-problema relacionadas a ${contents.toLowerCase()} com apoio de roteiro visual e exemplos resolvidos.\n- Identificar informações essenciais em enunciados, gráficos ou tabelas, registrando o raciocínio em etapas curtas.\n- Resolver ao menos três tarefas graduadas sobre ${subject}, utilizando checklist de procedimentos e tempo ampliado quando necessário.`,
    methodology: `09 - Metodologia:\nA aula será organizada em blocos curtos, com antecipação dos objetivos, apresentação de exemplo resolvido e roteiro passo a passo. Para ${student.name}, recomenda-se reduzir estímulos simultâneos, oferecer instruções objetivas, permitir consulta a material visual e dividir a atividade em etapas. As adaptações previstas incluem: ${student.accommodations}. O professor deverá confirmar compreensão antes da execução e registrar os apoios efetivamente utilizados.`,
    evaluation: `10 - Avaliação:\nA avaliação será processual, considerando participação, uso do roteiro, resolução de etapas e evolução em relação aos objetivos. Poderão ser utilizados tempo ampliado, resposta oral ou visual, menor quantidade de itens com maior qualidade de acompanhamento e registro de evidências por checklist, produção escrita e observação docente. Os critérios devem priorizar compreensão do conceito, estratégia usada e autonomia progressiva.`,
    results: `11 - Resultados Esperados:\nEspera-se que ${student.name} realize tarefas de ${subject} com maior previsibilidade, reconheça padrões básicos do conteúdo, registre etapas de resolução com apoio e avance na autonomia para solicitar ajuda, revisar respostas e explicar o caminho utilizado. O resultado será observado por produções concluídas, redução de ansiedade diante da tarefa e participação mais consistente nas atividades.`
  };
}

function generateActivities(student, subject, focus, contents) {
  return `12 - Sugestões de Atividades:

1. Atividade: Mapa visual do conteúdo
Objetivo: organizar os conceitos centrais de ${contents}.
Materiais: folha-guia, marcadores coloridos e exemplo pronto.
Como aplicar: apresentar um modelo, destacar palavras-chave e pedir que o estudante complete lacunas em etapas.
Adaptações/apoios: usar roteiro visual, instruções curtas e tempo ampliado.
Evidência para avaliar: mapa preenchido e explicação breve do estudante.

2. Atividade: Problema guiado em três passos
Objetivo: resolver uma situação relacionada a ${focus}.
Materiais: ficha com problema, quadro de passos e calculadora quando adequado.
Como aplicar: separar leitura, identificação de dados e resolução; validar cada etapa antes da próxima.
Adaptações/apoios: reduzir quantidade de itens e manter exemplo resolvido ao lado.
Evidência para avaliar: checklist de etapas concluídas.

3. Atividade: Cartões de decisão
Objetivo: escolher estratégias adequadas para diferentes tipos de questão.
Materiais: cartões com pistas, operações e representações visuais.
Como aplicar: o professor apresenta uma situação e o estudante seleciona o cartão que indica o primeiro passo.
Adaptações/apoios: permitir resposta oral e manipulação concreta dos cartões.
Evidência para avaliar: escolhas justificadas pelo estudante.

4. Atividade: Comparação com interesse do estudante
Objetivo: relacionar o conteúdo com um contexto significativo para ${student.name}.
Materiais: tabela simples, imagens e exemplos ligados a tecnologia ou rotina.
Como aplicar: construir um exemplo contextualizado e pedir ao estudante que complete dados faltantes.
Adaptações/apoios: oferecer previsibilidade, pausas curtas e linguagem direta.
Evidência para avaliar: tabela preenchida e participação na análise.

5. Atividade: Revisão em dupla com papéis definidos
Objetivo: favorecer participação social com segurança.
Materiais: roteiro de dupla com papéis de leitor e conferente.
Como aplicar: organizar uma dupla estável, definir papéis claros e alternar somente se houver conforto.
Adaptações/apoios: combinar previamente as interações e permitir mediação do professor.
Evidência para avaliar: registro da interação e da tarefa revisada.

6. Atividade: Saída curta de avaliação formativa
Objetivo: verificar compreensão sem sobrecarga.
Materiais: cartão de saída com três perguntas objetivas.
Como aplicar: ao final da aula, pedir uma resposta conceitual, uma etapa resolvida e uma dúvida restante.
Adaptações/apoios: permitir desenho, esquema ou resposta oral registrada pelo professor.
Evidência para avaliar: cartão de saída e observação sobre autonomia.`;
}

function extractNumberedSection(text, number, nextNumber) {
  const source = String(text || "");
  const startMatch = source.match(new RegExp(`(^|\\n)\\s*${number}\\s*[-.)]?`, "i"));
  if (!startMatch || startMatch.index === undefined) return "";

  const sectionStart = startMatch.index + startMatch[0].length;
  let section = source.slice(sectionStart);
  section = section.replace(/^\s*[^:\n]*:?\s*/, "");

  if (nextNumber) {
    const endMatch = section.match(new RegExp(`\\n\\s*${nextNumber}\\s*[-.)]?`, "i"));
    if (endMatch && endMatch.index !== undefined) {
      section = section.slice(0, endMatch.index);
    }
  }

  return section.trim();
}

function formatGeneratedSection(number, title, content, fallback) {
  return content ? `${number} - ${title}:\n${content}` : fallback;
}

function parsePeiResponse(text, fallback) {
  return {
    objectives: formatGeneratedSection(
      "07",
      "Objetivos Especificos",
      extractNumberedSection(text, "07", "09"),
      fallback.objectives
    ),
    methodology: formatGeneratedSection(
      "09",
      "Metodologia",
      extractNumberedSection(text, "09", "10"),
      fallback.methodology
    ),
    evaluation: formatGeneratedSection(
      "10",
      "Avaliacao",
      extractNumberedSection(text, "10", "11"),
      fallback.evaluation
    ),
    results: formatGeneratedSection(
      "11",
      "Resultados Esperados",
      extractNumberedSection(text, "11", null),
      fallback.results
    )
  };
}

function normalizeActivitiesResponse(text, fallback) {
  const cleaned = String(text || "").trim();
  if (!cleaned) return fallback;
  return /^\s*12\s*[-.)]?/i.test(cleaned) ? cleaned : `12 - Sugestoes de Atividades:\n\n${cleaned}`;
}

async function requestMaritalk(type, payload) {
  const response = await fetch("/api/maritalk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, ...payload })
  });

  if (!response.ok) {
    let message = "MariTalk indisponivel no ambiente atual.";
    try {
      const errorData = await response.json();
      message = errorData?.error || errorData?.detail || message;
    } catch {
      message = response.status === 404 ? "Rota /api/maritalk nao encontrada no deploy." : message;
    }
    throw new Error(message);
  }

  const data = await response.json();
  if (!data?.text) {
    throw new Error("MariTalk retornou uma resposta vazia.");
  }

  return data.text;
}

function setGenerationStatus(selector, message, variant) {
  const element = $(selector);
  if (!element) return;

  element.textContent = message;
  element.classList.toggle("is-success", variant === "success");
  element.classList.toggle("is-warning", variant === "warning");
}

function setButtonBusy(button, busy, busyLabel) {
  if (!button) return;

  if (busy) {
    button.dataset.defaultText = button.textContent;
    button.textContent = busyLabel;
    button.disabled = true;
    return;
  }

  button.textContent = button.dataset.defaultText || button.textContent;
  button.disabled = false;
}

function currentDate() {
  return new Intl.DateTimeFormat("pt-BR").format(new Date());
}

function printValue(value, fallback = "Não informado") {
  const text = String(value || fallback).trim();
  return escapeHtml(text || fallback).replace(/\r?\n/g, "<br>");
}

function cleanGeneratedHeading(value) {
  return String(value || "")
    .replace(/^\s*(?:0?[7-9]|1[0-2])\s*-\s*[^\n:]+:?\s*/i, "")
    .trim();
}

function openPrintableDocument(type, student, values) {
  const isPei = type === "pei";
  const documentName = isPei ? "Plano Educacional Individualizado" : "Atividades Adaptadas";
  const logoUrl = new URL("assets/cepi-ismael.webp", window.location.href).href;
  const printWindow = window.open("", "_blank", "width=980,height=820");

  if (!printWindow) {
    window.alert("Não foi possível abrir o PDF. Autorize janelas pop-up para este site e tente novamente.");
    return;
  }

  const sections = isPei
    ? [
        [null, "Conteúdos programáticos", values.contents],
        [null, "Objetivos específicos", cleanGeneratedHeading(values.objectives)],
        [null, "Metodologia", cleanGeneratedHeading(values.methodology)],
        [null, "Avaliação", cleanGeneratedHeading(values.evaluation)],
        [null, "Resultados esperados", cleanGeneratedHeading(values.results)]
      ]
    : [
        ["08", "Conteúdos base", values.contents],
        ["12", "Sugestões de atividades", cleanGeneratedHeading(values.output)]
      ];

  const sectionMarkup = sections
    .map(
      ([number, title, content]) => `
        <section class="document-section${number ? "" : " no-number"}">
          ${number ? `<div class="section-number">${number}</div>` : ""}
          <div>
            <h2>${title}</h2>
            <div class="section-content">${printValue(content)}</div>
          </div>
        </section>
      `
    )
    .join("");

  const focusMarkup = isPei
    ? ""
    : `<div><span>Foco da aula</span><strong>${printValue(values.focus)}</strong></div>`;

  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${documentName} - ${escapeHtml(student.name)}</title>
        <style>
          @page { size: A4; margin: 16mm 15mm 19mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #171918; background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; line-height: 1.52; }
          .print-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; max-width: 210mm; margin: 0 auto; padding: 12px 18px; background: #0f2926; color: #fff; font-size: 13px; }
          .print-toolbar button { min-height: 36px; padding: 0 15px; border: 0; border-radius: 999px; background: #f2c84b; color: #171918; font-weight: 700; cursor: pointer; }
          .document { width: 100%; max-width: 180mm; margin: 0 auto; padding: 18mm 0 10mm; }
          .document-header { display: grid; grid-template-columns: 104px 1fr auto; align-items: center; gap: 16px; padding-bottom: 16px; border-bottom: 3px solid #08766f; }
          .cepi-logo { position: relative; width: 96px; height: 80px; overflow: hidden; }
          .cepi-logo img { position: absolute; top: -6px; left: 50%; width: 152px; max-width: none; height: auto; transform: translateX(-50%); }
          .school-name small, .school-name strong { display: block; }
          .school-name small { color: #08766f; font-size: 8pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
          .school-name strong { margin-top: 5px; color: #0f2926; font-size: 13pt; line-height: 1.18; }
          .document-mark { padding: 7px 10px; border-radius: 999px; background: #e9f4ef; color: #075d58; font-size: 8pt; font-weight: 700; text-transform: uppercase; }
          .title-block { padding: 24px 0 18px; }
          .title-block span { color: #08766f; font-size: 8pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
          .title-block h1 { margin: 7px 0 0; color: #171918; font-size: 24pt; line-height: 1.08; letter-spacing: -0.025em; }
          .title-block p { margin: 8px 0 0; color: #68726d; }
          .meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; margin-top: 5px; }
          .meta-grid > div { padding: 11px 13px; border: 1px solid #e2e8e5; border-radius: 10px; background: #f7f9f8; }
          .meta-grid span, .meta-grid strong { display: block; }
          .meta-grid span { color: #68726d; font-size: 7.5pt; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; }
          .meta-grid strong { margin-top: 3px; color: #253a36; font-size: 10pt; }
          .context-box { margin-top: 18px; padding: 15px; border-left: 4px solid #f2c84b; border-radius: 0 12px 12px 0; background: #fff8df; }
          .context-box h2 { margin: 0 0 10px; color: #0f2926; font-size: 12pt; }
          .context-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px 16px; }
          .context-grid div { color: #39403d; font-size: 9pt; }
          .context-grid b { color: #171918; }
          .document-section { display: grid; grid-template-columns: 34px 1fr; gap: 12px; margin-top: 18px; padding-top: 16px; border-top: 1px solid #dfe7e3; break-inside: avoid; page-break-inside: avoid; }
          .document-section.no-number { grid-template-columns: 1fr; }
          .section-number { display: grid; place-items: center; width: 31px; height: 31px; border-radius: 50%; background: #08766f; color: #fff; font-size: 9pt; font-weight: 700; }
          .document-section h2 { margin: 3px 0 8px; color: #0f2926; font-size: 13pt; }
          .section-content { color: #39403d; white-space: normal; }
          .document-footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #dfe7e3; color: #68726d; font-size: 7.5pt; text-align: center; }
          @media print {
            .print-toolbar { display: none !important; }
            .document { max-width: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="print-toolbar"><span>Revise o documento e escolha <strong>Salvar como PDF</strong> na janela de impressão.</span><button type="button" onclick="window.print()">Imprimir novamente</button></div>
        <main class="document">
          <header class="document-header">
            <div class="cepi-logo"><img src="${logoUrl}" alt="Logo do CEPI Ismael Silva de Jesus" /></div>
            <div class="school-name"><small>Escola parceira</small><strong>CEPI Ismael Silva de Jesus</strong></div>
            <div class="document-mark">PEI Inteligente</div>
          </header>
          <section class="title-block">
            <span>Documento pedagógico</span>
            <h1>${documentName}</h1>
            <p>Documento elaborado no PEI Inteligente e revisado pelo profissional responsável.</p>
          </section>
          <section class="meta-grid">
            <div><span>Estudante</span><strong>${printValue(student.name)}</strong></div>
            <div><span>Curso e turma</span><strong>${printValue(`${student.course} - ${student.group}`)}</strong></div>
            <div><span>Docente</span><strong>${printValue(values.teacherName)}</strong></div>
            <div><span>Componente curricular</span><strong>${printValue(values.subject)}</strong></div>
            ${focusMarkup}
            <div><span>Data de emissão</span><strong>${currentDate()}</strong></div>
          </section>
          <section class="context-box">
            <h2>Contexto pedagógico do estudante</h2>
            <div class="context-grid">
              <div><b>Necessidades:</b> ${printValue(student.needs)}</div>
              <div><b>Habilidades:</b> ${printValue(student.skills)}</div>
              <div><b>Dificuldades:</b> ${printValue(student.difficulties)}</div>
              <div><b>Adaptações:</b> ${printValue(student.accommodations)}</div>
            </div>
          </section>
          ${sectionMarkup}
          <footer class="document-footer">CEPI Ismael Silva de Jesus - PEI Inteligente - Uso pedagógico</footer>
        </main>
        <script>
          window.addEventListener("load", function () {
            window.setTimeout(function () { window.print(); }, 450);
          });
        <\/script>
      </body>
    </html>`);
  printWindow.document.close();
}

function getFormValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function bindViewEvents() {
  $$("[data-view-shortcut]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.viewShortcut;
      render();
    });
  });

  const teacherSelect = $("[data-change-teacher]");
  if (teacherSelect) {
    teacherSelect.addEventListener("change", () => {
      state.teacherId = teacherSelect.value;
      state.selectedStudentId = getTeacherStudents()[0]?.id || "";
      render();
    });
  }

  const studentSelect = $("#student-select");
  if (studentSelect) {
    studentSelect.addEventListener("change", () => {
      state.selectedStudentId = studentSelect.value;
      render();
    });
  }

  $$("[data-open-pei]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedStudentId = button.dataset.openPei;
      state.view = "pei";
      render();
    });
  });

  $$("[data-open-activities]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedStudentId = button.dataset.openActivities;
      state.view = "activities";
      render();
    });
  });

  const studentForm = $("#student-form");
  if (studentForm) {
    studentForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = getFormValues(studentForm);
      data.students.push({
        id: createId("student"),
        name: values.name,
        age: values.age,
        course: values.course,
        group: values.group,
        diagnosis: values.diagnosis,
        history: values.history,
        needs: values.needs,
        skills: values.skills,
        difficulties: values.difficulties,
        accommodations: values.accommodations,
        notes: values.notes,
        teacherIds: values.teacherId ? [values.teacherId] : [],
        status: values.status
      });
      saveData();
      studentForm.reset();
      render();
    });
  }

  const teacherForm = $("#teacher-form");
  if (teacherForm) {
    teacherForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = getFormValues(teacherForm);
      data.teachers.push({
        id: createId("teacher"),
        name: values.name,
        area: values.area,
        email: values.email,
        phone: values.phone
      });
      saveData();
      teacherForm.reset();
      render();
    });
  }

  const assignmentForm = $("#assignment-form");
  if (assignmentForm) {
    assignmentForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = getFormValues(assignmentForm);
      const student = getStudent(values.studentId);
      student.teacherIds = Array.from(new Set([...(student.teacherIds || []), values.teacherId]));
      saveData();
      render();
    });
  }

  const peiForm = $("#pei-form");
  if (peiForm) {
    const generateButton = $("[data-generate-pei]");
    const pdfButton = $("[data-pdf-pei]");
    generateButton.addEventListener("click", async () => {
      const values = getFormValues(peiForm);
      const student = getStudent(state.selectedStudentId);
      const fallback = generatePei(student, values.subject, values.contents);
      let generated = fallback;
      setButtonBusy(generateButton, true, "Gerando...");
      setGenerationStatus("[data-pei-status]", "Preparando uma sugestão de PEI...", "");

      try {
        const response = await requestMaritalk("pei", {
          student,
          teacherName: values.teacherName,
          subject: values.subject,
          contents: values.contents
        });
        generated = parsePeiResponse(response, fallback);
        setGenerationStatus("[data-pei-status]", "Sugestão gerada com o serviço de IA configurado. Revise antes de salvar.", "success");
      } catch (error) {
        generated = fallback;
        setGenerationStatus(
          "[data-pei-status]",
          `O serviço de IA não respondeu. Uma sugestão demonstrativa local foi preenchida para você continuar. Motivo: ${error.message}`,
          "warning"
        );
      } finally {
        setButtonBusy(generateButton, false);
      }

      peiForm.elements.objectives.value = generated.objectives;
      peiForm.elements.methodology.value = generated.methodology;
      peiForm.elements.evaluation.value = generated.evaluation;
      peiForm.elements.results.value = generated.results;
    });
    pdfButton.addEventListener("click", () => {
      const values = getFormValues(peiForm);
      const student = getStudent(state.selectedStudentId);
      openPrintableDocument("pei", student, values);
    });
    peiForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = getFormValues(peiForm);
      data.peis.push({
        id: createId("pei"),
        studentId: state.selectedStudentId,
        teacherId: state.teacherId,
        teacherName: values.teacherName,
        subject: values.subject,
        contents: values.contents,
        objectives: values.objectives,
        methodology: values.methodology,
        evaluation: values.evaluation,
        results: values.results,
        date: currentDate()
      });
      saveData();
      render();
    });
  }

  const activityForm = $("#activity-form");
  if (activityForm) {
    const generateButton = $("[data-generate-activities]");
    const pdfButton = $("[data-pdf-activities]");
    generateButton.addEventListener("click", async () => {
      const values = getFormValues(activityForm);
      const student = getStudent(state.selectedStudentId);
      const fallback = generateActivities(student, values.subject, values.focus, values.contents);
      let output = fallback;
      setButtonBusy(generateButton, true, "Gerando...");
      setGenerationStatus("[data-activities-status]", "Preparando sugestões de atividades...", "");

      try {
        const response = await requestMaritalk("activities", {
          student,
          teacherName: values.teacherName,
          subject: values.subject,
          focus: values.focus,
          contents: values.contents
        });
        output = normalizeActivitiesResponse(response, fallback);
        setGenerationStatus("[data-activities-status]", "Sugestões geradas com o serviço de IA configurado. Revise antes de salvar.", "success");
      } catch (error) {
        output = fallback;
        setGenerationStatus(
          "[data-activities-status]",
          `O serviço de IA não respondeu. Sugestões demonstrativas locais foram preenchidas para você continuar. Motivo: ${error.message}`,
          "warning"
        );
      } finally {
        setButtonBusy(generateButton, false);
      }

      activityForm.elements.output.value = output;
    });
    pdfButton.addEventListener("click", () => {
      const values = getFormValues(activityForm);
      const student = getStudent(state.selectedStudentId);
      openPrintableDocument("activities", student, values);
    });
    activityForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = getFormValues(activityForm);
      data.activities.push({
        id: createId("activity"),
        studentId: state.selectedStudentId,
        teacherId: state.teacherId,
        teacherName: values.teacherName,
        subject: values.subject,
        focus: values.focus,
        contents: values.contents,
        output: values.output,
        date: currentDate()
      });
      saveData();
      render();
    });
  }
}

function bindGlobalEvents() {
  $$("[data-role-option]").forEach((button) => {
    button.addEventListener("click", () => setRoleChoice(button.dataset.roleOption));
  });

  $("#login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    login(state.selectedRole, $("#login-user").value, $("#login-pass").value);
  });

  document.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) {
      state.view = viewButton.dataset.view;
      render();
      return;
    }

    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "logout") logout();
    if (action === "home") {
      event.preventDefault();
      state.view = state.role === "admin" ? "dashboard" : "teacherHome";
      render();
    }
    if (action === "reset-data") {
      resetData();
    }
  });
}

bindGlobalEvents();
setRoleChoice("admin");
saveData();
