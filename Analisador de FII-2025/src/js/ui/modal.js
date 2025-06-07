/**
 * Módulo para gerenciamento de modais
 * Responsável por exibir informações e avisos ao usuário
 */

const Modal = (() => {
    'use strict';

    /**
     * Elementos DOM do modal
     */
    let elements = {};

    /**
     * Estado atual do modal
     */
    let isOpen = false;
    let currentModal = null;

    /**
     * Configurações padrão
     */
    const DEFAULT_CONFIG = {
        closeOnEscape: true,
        closeOnOverlay: true,
        showCloseButton: true,
        autoClose: false,
        autoCloseDelay: 5000
    };

    /**
     * Inicializa o módulo do modal
     */
    const init = () => {
        // Busca elementos DOM
        elements = {
            modal: document.getElementById('infoModal'),
            overlay: document.getElementById('infoModal'),
            container: document.querySelector('#infoModal .bg-white'),
            closeButton: document.getElementById('closeModal'),
            infoButton: document.getElementById('infoButton')
        };

        // Verifica se os elementos existem
        if (!elements.modal) {
            console.error('Elemento modal não encontrado');
            return false;
        }

        // Configura event listeners
        setupEventListeners();
        
        console.log('Modal inicializado com sucesso');
        return true;
    };

    /**
     * Configura event listeners do modal
     */
    const setupEventListeners = () => {
        // Botão de fechar
        if (elements.closeButton) {
            elements.closeButton.addEventListener('click', close);
        }

        // Botão de informações
        if (elements.infoButton) {
            elements.infoButton.addEventListener('click', showInfoModal);
        }

        // Clique no overlay para fechar
        if (elements.overlay) {
            elements.overlay.addEventListener('click', (event) => {
                if (event.target === elements.overlay) {
                    close();
                }
            });
        }

        // Tecla ESC para fechar
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && isOpen) {
                close();
            }
        });

        // Previne scroll do body quando modal está aberto
        elements.modal?.addEventListener('scroll', (event) => {
            event.stopPropagation();
        });
    };

    /**
     * Abre o modal
     * @param {Object} config - Configurações do modal
     */
    const open = (config = {}) => {
        if (!elements.modal) {
            console.error('Modal não inicializado');
            return;
        }

        const finalConfig = { ...DEFAULT_CONFIG, ...config };

        // Marca como aberto
        isOpen = true;
        currentModal = finalConfig;

        // Remove classe hidden e adiciona show
        elements.modal.classList.remove('hidden');
        elements.modal.classList.add('show');

        // Adiciona classe ao body para prevenir scroll
        document.body.classList.add('modal-open');

        // Foca no modal para acessibilidade
        if (elements.container) {
            elements.container.focus();
        }

        // Auto-close se configurado
        if (finalConfig.autoClose && finalConfig.autoCloseDelay > 0) {
            setTimeout(() => {
                if (isOpen) close();
            }, finalConfig.autoCloseDelay);
        }

        // Dispara evento customizado
        dispatchModalEvent('modal:open', { config: finalConfig });

        console.log('Modal aberto');
    };

    /**
     * Fecha o modal
     */
    const close = () => {
        if (!isOpen || !elements.modal) return;

        // Marca como fechado
        isOpen = false;
        currentModal = null;

        // Remove classes de exibição
        elements.modal.classList.remove('show');
        elements.modal.classList.add('hidden');

        // Remove classe do body
        document.body.classList.remove('modal-open');

        // Retorna foco para o botão que abriu (se existir)
        if (elements.infoButton) {
            elements.infoButton.focus();
        }

        // Dispara evento customizado
        dispatchModalEvent('modal:close');

        console.log('Modal fechado');
    };

    /**
     * Alterna estado do modal
     */
    const toggle = () => {
        if (isOpen) {
            close();
        } else {
            showInfoModal();
        }
    };

    /**
     * Exibe modal de informações padrão
     */
    const showInfoModal = () => {
        open({
            type: 'info',
            closeOnEscape: true,
            closeOnOverlay: true
        });
    };

    /**
     * Cria e exibe modal customizado
     * @param {Object} options - Opções do modal
     */
    const showCustomModal = (options = {}) => {
        const {
            title = 'Informação',
            content = '',
            type = 'info',
            buttons = [],
            ...config
        } = options;

        // Cria modal dinamicamente se necessário
        const modalHtml = createModalHTML(title, content, type, buttons);
        
        // Se não há modal existente, cria um temporário
        if (!elements.modal) {
            const tempModal = document.createElement('div');
            tempModal.innerHTML = modalHtml;
            document.body.appendChild(tempModal.firstElementChild);
            
            // Atualiza referências
            elements.modal = document.querySelector('.modal-overlay');
            elements.container = elements.modal?.querySelector('.modal-container');
        }

        open(config);
    };

    /**
     * Cria HTML do modal customizado
     * @param {string} title - Título do modal
     * @param {string} content - Conteúdo do modal
     * @param {string} type - Tipo do modal (info, warning, error, success)
     * @param {Array} buttons - Botões do modal
     * @returns {string} - HTML do modal
     */
    const createModalHTML = (title, content, type, buttons) => {
        const iconMap = {
            info: `<svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>`,
            warning: `<svg class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>`,
            error: `<svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>`,
            success: `<svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>`
        };

        const defaultButtons = buttons.length > 0 ? buttons : [
            { text: 'Entendi', action: 'close', primary: true }
        ];

        const buttonsHTML = defaultButtons.map(button => {
            const classes = button.primary 
                ? 'modal-button modal-button-primary'
                : 'modal-button modal-button-secondary';
            
            return `<button type="button" class="${classes}" data-action="${button.action || 'close'}">
                      ${button.text}
                    </button>`;
        }).join('');

        return `
            <div class="modal-overlay fixed inset-0 bg-black bg-opacity-50 z-50 hidden">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="modal-container bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div class="flex items-center mb-4">
                            <div class="flex-shrink-0">
                                ${iconMap[type] || iconMap.info}
                            </div>
                            <div class="ml-3">
                                <h3 class="text-lg font-medium text-gray-900">${title}</h3>
                            </div>
                        </div>
                        <div class="mt-2">
                            <div class="text-sm text-gray-500">
                                ${content}
                            </div>
                        </div>
                        <div class="mt-5 sm:mt-6 flex gap-3 justify-end">
                            ${buttonsHTML}
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    /**
     * Exibe modal de erro
     * @param {string} message - Mensagem de erro
     * @param {Object} options - Opções adicionais
     */
    const showError = (message, options = {}) => {
        showCustomModal({
            title: 'Erro',
            content: message,
            type: 'error',
            ...options
        });
    };

    /**
     * Exibe modal de aviso
     * @param {string} message - Mensagem de aviso
     * @param {Object} options - Opções adicionais
     */
    const showWarning = (message, options = {}) => {
        showCustomModal({
            title: 'Aviso',
            content: message,
            type: 'warning',
            ...options
        });
    };

    /**
     * Exibe modal de sucesso
     * @param {string} message - Mensagem de sucesso
     * @param {Object} options - Opções adicionais
     */
    const showSuccess = (message, options = {}) => {
        showCustomModal({
            title: 'Sucesso',
            content: message,
            type: 'success',
            autoClose: true,
            autoCloseDelay: 3000,
            ...options
        });
    };

    /**
     * Exibe modal de confirmação
     * @param {string} message - Mensagem de confirmação
     * @param {Function} onConfirm - Callback para confirmação
     * @param {Object} options - Opções adicionais
     */
    const showConfirm = (message, onConfirm, options = {}) => {
        const buttons = [
            { text: 'Cancelar', action: 'cancel', primary: false },
            { text: 'Confirmar', action: 'confirm', primary: true }
        ];

        showCustomModal({
            title: 'Confirmação',
            content: message,
            type: 'warning',
            buttons: buttons,
            closeOnEscape: false,
            closeOnOverlay: false,
            ...options
        });

        // Adiciona listeners para os botões
        const handleButtonClick = (event) => {
            const action = event.target.dataset.action;
            
            if (action === 'confirm' && typeof onConfirm === 'function') {
                onConfirm();
            }
            
            close();
            document.removeEventListener('click', handleButtonClick);
        };

        document.addEventListener('click', handleButtonClick);
    };

    /**
     * Dispara evento customizado do modal
     * @param {string} eventName - Nome do evento
     * @param {Object} detail - Detalhes do evento
     */
    const dispatchModalEvent = (eventName, detail = {}) => {
        const event = new CustomEvent(eventName, {
            detail: {
                modal: elements.modal,
                isOpen: isOpen,
                ...detail
            }
        });
        
        document.dispatchEvent(event);
    };

    /**
     * Verifica se o modal está aberto
     * @returns {boolean} - Se está aberto
     */
    const isModalOpen = () => isOpen;

    /**
     * Obtém configuração atual do modal
     * @returns {Object|null} - Configuração atual
     */
    const getCurrentConfig = () => currentModal;

    /**
     * Limpa recursos do modal
     */
    const destroy = () => {
        if (isOpen) {
            close();
        }

        // Remove event listeners
        if (elements.closeButton) {
            elements.closeButton.removeEventListener('click', close);
        }

        if (elements.infoButton) {
            elements.infoButton.removeEventListener('click', showInfoModal);
        }

        // Limpa referências
        elements = {};
        currentModal = null;
        isOpen = false;

        console.log('Modal destruído');
    };

    // API pública
    return {
        // Inicialização
        init,
        destroy,
        
        // Controle básico
        open,
        close,
        toggle,
        
        // Modais específicos
        showInfoModal,
        showCustomModal,
        showError,
        showWarning,
        showSuccess,
        showConfirm,
        
        // Estado
        isModalOpen,
        getCurrentConfig,
        
        // Constantes
        DEFAULT_CONFIG
    };
})();

// Disponibilizar globalmente
window.Modal = Modal;