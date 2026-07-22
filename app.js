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
  $("#session-label").textContent = isAdmin ? "Administrador em teste" : `${getTeacherName(state.teacherId)} - professor em teste`;
  $("#module-title").textContent = isAdmin ? "Administrador" : "Professor";
  $("#module-description").textContent = isAdmin
    ? "Gestão de alunos, professores e vínculos."
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
      <strong>Protótipo público e demonstrativo</strong>
      <span>Use apenas dados fictícios ou anonimizados. Os cadastros ficam salvos neste navegador. A geração tenta usar MariTalk/Sabia-3 quando a variável segura do Vercel estiver configurada; caso contrário, usa resposta simulada.</span>
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
        <p>Acompanhe alunos cadastrados, professores vinculados e documentos produzidos no protótipo.</p>
      </div>
      <div class="actions-row">
        <button class="button button-secondary" type="button" data-view-shortcut="students">Cadastrar aluno</button>
        <button class="button button-primary" type="button" data-view-shortcut="teachers">Cadastrar professor</button>
      </div>
    </div>
    ${renderNotice()}
    <section class="grid three">
      <article class="stat-card"><span>Alunos da inclusão</span><strong>${data.students.length}</strong><p>Inclui o aluno fictício inicial.</p></article>
      <article class="stat-card"><span>Professores</span><strong>${data.teachers.length}</strong><p>Docentes disponíveis para vínculo.</p></article>
      <article class="stat-card"><span>Alunos vinculados</span><strong>${linked}</strong><p>Com ao menos um professor associado.</p></article>
      <article class="stat-card"><span>Registros pedagógicos</span><strong>${peis + activities}</strong><p>PEIs e atividades salvos no protótipo.</p></article>
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
          <p>Resumo dos docentes disponíveis no protótipo.</p>
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
        <label>Docente em teste
          <select data-change-teacher>
            ${data.teachers.map((teacher) => `<option value="${teacher.id}" ${teacher.id === state.teacherId ? "selected" : ""}>${escapeHtml(teacher.name)}</option>`).join("")}
          </select>
        </label>
      </div>
    </div>
    ${renderNotice()}
    <section class="grid three">
      <article class="stat-card"><span>Alunos vinculados</span><strong>${students.length}</strong><p>Disponíveis para este professor.</p></article>
      <article class="stat-card"><span>PEIs salvos</span><strong>${data.peis.filter((pei) => students.some((student) => student.id === pei.studentId)).length}</strong><p>Registros feitos no protótipo.</p></article>
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
        <p>Fluxo inspirado no modelo MariTalk/Sabia-3 do arquivo enviado, com campos editáveis e fallback simulado.</p>
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
          <p>Preencha o componente e o conteúdo. O botão tenta gerar com MariTalk no Vercel e usa simulação quando a API não estiver configurada.</p>
        </div>
        <span class="mini-tag gold">Campos 07, 09, 10 e 11</span>
      </div>
      <div class="model-box">
        <strong>Modelo MariTalk no protótipo:</strong>
        gera objetivos específicos, metodologia, avaliação e resultados esperados considerando necessidades, habilidades, dificuldades, adaptações e conteúdos programáticos. Não envie dados reais nesta versão pública.
      </div>
      <form class="data-form" id="pei-form">
        <div class="field-grid">
          <label>Docente<input name="teacherName" value="${escapeHtml(getTeacherName(state.teacherId))}" readonly /></label>
          <label>Componente curricular<input name="subject" value="${escapeHtml(latest.subject || "Matemática")}" required /></label>
          <label class="wide">(08) Conteúdos programáticos<textarea name="contents" required>${escapeHtml(latest.contents || "Funções afins: interpretação de gráficos, relação entre variáveis e resolução de problemas contextualizados.")}</textarea></label>
          <label>(07) Objetivos específicos<textarea name="objectives">${escapeHtml(latest.objectives || "")}</textarea></label>
          <label>(09) Metodologia<textarea name="methodology">${escapeHtml(latest.methodology || "")}</textarea></label>
          <label>(10) Avaliação<textarea name="evaluation">${escapeHtml(latest.evaluation || "")}</textarea></label>
          <label>(11) Resultados esperados<textarea name="results">${escapeHtml(latest.results || "")}</textarea></label>
        </div>
        <div class="split-actions">
          <button class="button button-secondary" type="button" data-generate-pei>Gerar com MariTalk</button>
          <button class="button button-primary" type="submit">Salvar PEI</button>
          <button class="button button-ghost" type="button" data-export-pei>Exportar texto</button>
        </div>
        <p class="generation-status" data-pei-status aria-live="polite">Ao gerar, este aviso confirma se a resposta veio do MariTalk ou da simulacao local.</p>
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
          <p>Registros salvos para este estudante no protótipo.</p>
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
        <p>O gerador lê as informações do aluno e simula atividades prontas para aplicar, com apoios e evidências de avaliação.</p>
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
          <p>Tenta usar MariTalk/Sabia-3 para o bloco 12 e mantém fallback simulado para demonstração.</p>
        </div>
        <span class="mini-tag blue">Bloco 12</span>
      </div>
      <form class="data-form" id="activity-form">
        <div class="field-grid">
          <label>Docente<input name="teacherName" value="${escapeHtml(getTeacherName(state.teacherId))}" readonly /></label>
          <label>Componente curricular<input name="subject" value="${escapeHtml(latest.subject || "Matemática")}" required /></label>
          <label>Foco da aula<input name="focus" value="${escapeHtml(latest.focus || "Leitura de gráficos e resolução de situações-problema")}" required /></label>
          <label class="wide">(08) Conteúdos base<textarea name="contents" required>${escapeHtml(latest.contents || "Funções afins, interpretação de gráficos, padrões de crescimento e aplicações no cotidiano.")}</textarea></label>
          <label class="wide">(12) Sugestões de atividades<textarea class="generated-output" name="output">${escapeHtml(latest.output || "")}</textarea></label>
        </div>
        <div class="split-actions">
          <button class="button button-secondary" type="button" data-generate-activities>Gerar com MariTalk</button>
          <button class="button button-primary" type="submit">Salvar atividades</button>
          <button class="button button-ghost" type="button" data-export-activities>Exportar texto</button>
        </div>
        <p class="generation-status" data-activities-status aria-live="polite">Ao gerar, este aviso confirma se a resposta veio do MariTalk ou da simulacao local.</p>
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

function downloadText(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
    const exportButton = $("[data-export-pei]");
    generateButton.addEventListener("click", async () => {
      const values = getFormValues(peiForm);
      const student = getStudent(state.selectedStudentId);
      const fallback = generatePei(student, values.subject, values.contents);
      let generated = fallback;
      setButtonBusy(generateButton, true, "Gerando...");
      setGenerationStatus("[data-pei-status]", "Tentando gerar com MariTalk/Sabia-3...", "");

      try {
        const response = await requestMaritalk("pei", {
          student,
          teacherName: values.teacherName,
          subject: values.subject,
          contents: values.contents
        });
        generated = parsePeiResponse(response, fallback);
        setGenerationStatus("[data-pei-status]", "Gerado com o modelo Sabiázinho-4. A API foi usada neste clique.", "success");
      } catch (error) {
        generated = fallback;
        setGenerationStatus(
          "[data-pei-status]",
          `Nao foi possivel usar MariTalk agora. O prototipo preencheu uma simulacao local. Motivo: ${error.message}`,
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
    exportButton.addEventListener("click", () => {
      const values = getFormValues(peiForm);
      const student = getStudent(state.selectedStudentId);
      downloadText(`PEI_${student.name.replaceAll(" ", "_")}.txt`, buildPeiText(student, values));
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
    const exportButton = $("[data-export-activities]");
    generateButton.addEventListener("click", async () => {
      const values = getFormValues(activityForm);
      const student = getStudent(state.selectedStudentId);
      const fallback = generateActivities(student, values.subject, values.focus, values.contents);
      let output = fallback;
      setButtonBusy(generateButton, true, "Gerando...");
      setGenerationStatus("[data-activities-status]", "Tentando gerar com MariTalk/Sabia-3...", "");

      try {
        const response = await requestMaritalk("activities", {
          student,
          teacherName: values.teacherName,
          subject: values.subject,
          focus: values.focus,
          contents: values.contents
        });
        output = normalizeActivitiesResponse(response, fallback);
        setGenerationStatus("[data-activities-status]", "Gerado com MariTalk/Sabia-3. A API foi usada neste clique.", "success");
      } catch (error) {
        output = fallback;
        setGenerationStatus(
          "[data-activities-status]",
          `Nao foi possivel usar MariTalk agora. O prototipo preencheu uma simulacao local. Motivo: ${error.message}`,
          "warning"
        );
      } finally {
        setButtonBusy(generateButton, false);
      }

      activityForm.elements.output.value = output;
    });
    exportButton.addEventListener("click", () => {
      const values = getFormValues(activityForm);
      const student = getStudent(state.selectedStudentId);
      downloadText(`Atividades_${student.name.replaceAll(" ", "_")}.txt`, buildActivityText(student, values));
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

function buildPeiText(student, values) {
  return `PEI Inteligente - Protótipo

Estudante: ${student.name}
Curso/Turma: ${student.course} - ${student.group}
Docente: ${values.teacherName}
Componente curricular: ${values.subject}

Diagnóstico/contexto:
${student.diagnosis}

Necessidades:
${student.needs}

Habilidades:
${student.skills}

Dificuldades:
${student.difficulties}

Adaptações:
${student.accommodations}

(08) Conteúdos Programáticos:
${values.contents}

${values.objectives}

${values.methodology}

${values.evaluation}

${values.results}
`;
}

function buildActivityText(student, values) {
  return `PEI Inteligente - Protótipo de atividades adaptadas

Estudante: ${student.name}
Docente: ${values.teacherName}
Componente curricular: ${values.subject}
Foco: ${values.focus}

Contexto do estudante:
Necessidades: ${student.needs}
Habilidades: ${student.skills}
Dificuldades: ${student.difficulties}
Adaptações: ${student.accommodations}

(08) Conteúdos base:
${values.contents}

${values.output}
`;
}

function bindGlobalEvents() {
  $$("[data-role-option]").forEach((button) => {
    button.addEventListener("click", () => setRoleChoice(button.dataset.roleOption));
  });

  $$("[data-demo-login]").forEach((button) => {
    button.addEventListener("click", () => {
      const role = button.dataset.demoLogin;
      setRoleChoice(role);
      login(role, role === "admin" ? "administrador" : "professor", "123456");
    });
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
