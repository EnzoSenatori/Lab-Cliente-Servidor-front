const API_URL = "http://localhost:5000";

async function buscarLivros() {
    const termo = document.getElementById("buscaInput").value;
    const button = document.querySelector(".search-bar .btn-primary");
    const originalText = button ? button.textContent : null;

    if (button) {
        button.disabled = true;
        button.textContent = "Buscando...";
    }

    try {
        const response = await fetch(`${API_URL}/livros?q=${termo}`);
        const data = await response.json();

        const container = document.getElementById("resultados");
        container.innerHTML = "";

        if (data.status !== 200) {
            container.innerHTML = `<div class="error">${data.erro}</div>`;
            return;
        }

        data.data.forEach((livro, index) => {
            const div = document.createElement("div");
            div.className = "card";
            div.style.animationDelay = `${index * 30}ms`;

            div.innerHTML = `
                <h3 class="card-title">${livro.titulo}</h3>
                <div class="meta-row">
                    <span class="meta-label">Autor</span>
                    <span class="meta-value">${livro.autor}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Editora</span>
                    <span class="meta-value">${livro.editora}</span>
                </div>
                <div class="card-actions">
                    <button type="button" class="btn btn-secondary btn-block" onclick="detalharLivro(${livro.id})">
                        Detalhar
                    </button>
                </div>
            `;

            container.appendChild(div);
        });
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }
}

async function detalharLivro(id) {
    const response = await fetch(`${API_URL}/livros/${id}`);
    const data = await response.json();

    const container = document.getElementById("detalhes");
    container.innerHTML = "";

    if (data.status !== 200) {
        container.innerHTML = `<div class="error">${data.erro}</div>`;
        return;
    }

    const livro = data.data;

    let unidadesHtml = "";

    for (const unidade in livro.unidades) {
        unidadesHtml += `
            <li>
                <div class="unit-info">
                    <span class="unit-name">${unidade}</span>
                    <span class="unit-status">${livro.unidades[unidade]}</span>
                </div>
                <button type="button" class="btn btn-secondary" onclick="mostrarFormulario(${livro.id}, '${unidade}')">
                    Reservar
                </button>
            </li>
        `;
    }

    const dispText = livro.disponibilidade || "";
    const isAvailable = /dispon[íi]vel/i.test(dispText) && !/indispon[íi]vel/i.test(dispText);
    const badgeClass = isAvailable ? "badge-success" : "badge-muted";

    container.innerHTML = `
        <div class="detail-card">
            <h3 class="detail-title">${livro.titulo}</h3>
            <div class="detail-meta">
                <span>${livro.autor}</span>
                <span aria-hidden="true">·</span>
                <span>${livro.editora}</span>
            </div>
            <span class="badge ${badgeClass}">${dispText}</span>
            <ul class="unit-list">${unidadesHtml}</ul>
        </div>
    `;
}

function mostrarFormulario(livroId, unidade) {
    const container = document.getElementById("reserva");

    const hoje = new Date().toISOString().split("T")[0];

    container.innerHTML = `
        <div class="reservation-card">
            <h3>Reservar</h3>
            <div class="form-group">
                <label for="nome">Seu nome</label>
                <input type="text" id="nome" placeholder="Digite seu nome">
            </div>
            <div class="form-group">
                <label for="data">Data da reserva</label>
                <input type="date" id="data" min="${hoje}">
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-primary btn-block" onclick="reservar(${livroId}, '${unidade}')">
                    Confirmar reserva
                </button>
            </div>
        </div>
    `;
}

async function reservar(livroId, unidade) {
    const nome = document.getElementById("nome").value;
    const data = document.getElementById("data").value;

    const response = await fetch(`${API_URL}/reservas`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            livro_id: livroId,
            unidade: unidade,
            nome_cliente: nome || null,
            data_reserva: data || null
        })
    });

    const result = await response.json();

    const container = document.getElementById("reserva");

    if (result.status !== 201) {
        container.innerHTML = `<div class="error">${result.erro}</div>`;
        return;
    }

    const reserva = result.data;

    container.innerHTML = `
        <div class="success-card">
            <h3><span class="success-check">✓</span> Reserva confirmada!</h3>
            <p class="reservation-id-row">ID: <span class="code-chip">${reserva.id}</span></p>
            <div class="qr-wrapper">
                <img alt="QR code da reserva" src="${reserva.qr_code_base64}" />
            </div>
        </div>
    `;
}

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("buscaInput");
    if (input) {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                buscarLivros();
            }
        });
    }
});
