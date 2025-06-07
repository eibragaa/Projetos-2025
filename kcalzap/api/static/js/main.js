// Configuração do Stripe
let stripe;
if (typeof Stripe !== 'undefined') {
    stripe = Stripe('seu_stripe_publishable_key');
}

// Funções de utilidade
function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatarCalorias(calorias) {
    return `${calorias} kcal`;
}

// Funções para gráficos (usando Chart.js)
function criarGraficoNutrientes(ctx, dados) {
    if (typeof Chart !== 'undefined') {
        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Carboidratos', 'Proteínas', 'Gorduras'],
                datasets: [{
                    data: dados,
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

// Funções para manipulação de formulários
function configurarFormularioAssinatura() {
    const form = document.getElementById('form-assinatura');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const plano = form.querySelector('input[name="plano"]:checked').value;
            
            try {
                const response = await fetch('/criar-sessao-checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ plano })
                });
                
                const session = await response.json();
                await stripe.redirectToCheckout({
                    sessionId: session.id
                });
            } catch (error) {
                console.error('Erro ao processar assinatura:', error);
                alert('Erro ao processar assinatura. Tente novamente.');
            }
        });
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Configurar tooltips do Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Configurar formulário de assinatura
    configurarFormularioAssinatura();

    // Adicionar classes de animação aos elementos
    document.querySelectorAll('.card, .chart-container').forEach(element => {
        element.classList.add('fade-in');
    });
}); 