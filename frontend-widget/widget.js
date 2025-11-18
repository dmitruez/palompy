(function () {
    const script = document.currentScript;
    if (!script) {
        console.error('[palompy] Unable to locate current script tag.');
        return;
    }

    // Минимальный набор текстов
    const translations = {
        ru: {
            toggleLabel: 'Открыть чат с ассистентом',
            headerTitle: 'AI ассистент',
            headerSubtitle: 'Онлайн 24/7',
            welcome: 'Здравствуйте! Я помогу рассказать про доставку, наличие и акции магазина.',
            placeholder: 'Напишите вопрос…',
            send: 'Отправить',
            quickPrompts: ['Расскажите про доставку', 'Какие акции есть?', 'Помогите выбрать товар'],
            statusShort: {
                ready: 'Онлайн',
                connecting: 'Ищем ответ…',
                offline: 'Нет соединения',
            },
            statusDetail: {
                ready: 'Готов ответить на ваши вопросы.',
                connecting: 'Соединяемся с ассистентом…',
                offline: 'Сервис временно недоступен. Попробуйте позже.',
            },
            fallbackAnswer: 'Пока нет ответа, попробуйте переформулировать вопрос или написать позже.',
            errorAnswer: 'Извините, что-то пошло не так. Попробуйте позже.',
        },
        en: {
            toggleLabel: 'Open assistant chat',
            headerTitle: 'AI assistant',
            headerSubtitle: 'Here for you 24/7',
            welcome: 'Hi! I can help you with shipping, availability and promotions.',
            placeholder: 'Type your question…',
            send: 'Send',
            quickPrompts: ['Tell me about shipping', 'What promotions are running?', 'Help me pick a product'],
            statusShort: {
                ready: 'Online',
                connecting: 'Finding an answer…',
                offline: 'Offline',
            },
            statusDetail: {
                ready: 'Ready for your question.',
                connecting: 'Talking to the assistant…',
                offline: 'Service is unavailable. Please try again later.',
            },
            fallbackAnswer: 'No answer yet, please try asking again in a moment.',
            errorAnswer: 'Sorry, something went wrong. Please try again later.',
        },
    };

    function resolveLanguage() {
        const attr = (script.dataset.lang || '').toLowerCase();
        if (attr.startsWith('ru')) return 'ru';
        if (attr.startsWith('en')) return 'en';
        if (navigator.language && navigator.language.toLowerCase().startsWith('ru')) return 'ru';
        return 'en';
    }

    function init() {
        const shopPublicKey = script.dataset.shopId;
        if (!shopPublicKey) {
            console.error('[palompy] data-shop-id attribute is required.');
            return;
        }

        const language = resolveLanguage();
        const texts = translations[language] || translations.en;

        const apiBase = script.dataset.apiBase || new URL(script.src, window.location.href).origin;
        const normalizedBase = apiBase.replace(/\/$/, '');
        const chatEndpoint = `${normalizedBase}/api/chat`;

        injectStylesheet(script.src);

        const sessionKey = `palompy_session_${shopPublicKey}`;
        const sessionId = getOrCreateSession(sessionKey);

        const quickPrompts = parsePrompts(script.dataset.prompts) ?? texts.quickPrompts;

        const state = {
            isOpen: false,
            isSending: false,
            unread: 0,
            size: 'normal', // normal | wide
        };

        const elements = buildWidget(texts, quickPrompts);

        appendMessage(texts.welcome, 'bot');
        updateStatus('ready');

        // === Слушатели ===

        elements.toggle.addEventListener('click', () => {
            toggleWindow(!state.isOpen);
        });

        elements.close.addEventListener('click', () => toggleWindow(false));

        elements.sizeToggle.addEventListener('click', () => {
            state.size = state.size === 'normal' ? 'wide' : 'normal';
            elements.window.classList.toggle('palompy-chat-window--wide', state.size === 'wide');
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && state.isOpen) {
                toggleWindow(false);
            }
        });

        elements.form.addEventListener('submit', (event) => {
            event.preventDefault();
            void handleSend();
        });

        elements.textarea.addEventListener('input', autoResizeTextArea);
        elements.textarea.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
            }
        });

        elements.quickPromptButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                const prompt = btn.dataset.prompt || '';
                if (!prompt) return;
                toggleWindow(true);
                void handleSend(prompt);
            });
        });

        autoResizeTextArea();

        // === Функции ===

        function toggleWindow(open) {
            state.isOpen = open;
            elements.window.classList.toggle('hidden', !open);
            elements.toggle.setAttribute('aria-expanded', String(open));
            if (open) {
                resetUnread();
                elements.textarea.focus();
            }
        }

        function autoResizeTextArea() {
            const textarea = elements.textarea;
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
        }

        function resetUnread() {
            state.unread = 0;
            elements.unread.textContent = '0';
            elements.unread.hidden = true;
            elements.toggle.classList.remove('palompy-chat-toggle--has-unread');
        }

        function bumpUnread() {
            state.unread += 1;
            elements.unread.textContent = String(state.unread);
            elements.unread.hidden = false;
            elements.toggle.classList.add('palompy-chat-toggle--has-unread');
        }

        async function handleSend(prefilledMessage) {
            if (state.isSending) return;
            const message = (prefilledMessage ?? elements.textarea.value).trim();
            if (!message) return;

            appendMessage(message, 'user');
            elements.textarea.value = '';
            autoResizeTextArea();

            state.isSending = true;
            updateStatus('connecting');

            try {
                const response = await fetch(chatEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        shopPublicKey,
                        sessionId,
                        message,
                        language,
                        metadata: {
                            pageUrl: window.location.href,
                            pageTitle: document.title,
                        },
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Network error: ${response.status}`);
                }

                const data = await response.json();
                const answer = (data.answer || texts.fallbackAnswer).toString();
                appendMessage(answer, 'bot');
                updateStatus('ready');
            } catch (error) {
                console.error('[palompy] chat error', error);
                appendMessage(texts.errorAnswer, 'bot');
                updateStatus('offline');
            } finally {
                state.isSending = false;
            }
        }

        function appendMessage(text, author) {
            const wrapper = document.createElement('div');
            wrapper.className = `palompy-chat-message ${author}`;
            const bubble = document.createElement('div');
            bubble.className = 'palompy-chat-bubble';
            bubble.textContent = text;
            wrapper.appendChild(bubble);
            elements.messages.appendChild(wrapper);
            elements.messages.scrollTop = elements.messages.scrollHeight;

            if (author === 'bot' && !state.isOpen) {
                bumpUnread();
            }
        }

        function updateStatus(statusKey) {
            elements.statusText.textContent = texts.statusDetail[statusKey];
            elements.statusChip.textContent = texts.statusShort[statusKey];
            elements.statusDot.dataset.state = statusKey;
            elements.statusDot.setAttribute('aria-label', texts.statusShort[statusKey]);
        }

        // === Публичный API ===
        window.PalompyWidget = {
            open: () => toggleWindow(true),
            close: () => toggleWindow(false),
            toggle: () => toggleWindow(!state.isOpen),
            isOpen: () => state.isOpen,
            send: (message) => {
                if (!message) return;
                toggleWindow(true);
                return handleSend(String(message));
            },
            appendBotMessage: (message) => appendMessage(String(message), 'bot'),
        };
    }

    function buildWidget(texts, quickPrompts) {
        // Кнопка-таб с чатом
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'palompy-chat-toggle';
        toggle.setAttribute('aria-label', texts.toggleLabel);
        toggle.setAttribute('aria-expanded', 'false');

        const icon = document.createElement('span');
        icon.className = 'palompy-toggle-icon';
        icon.innerHTML =
            '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">\
              <path d="M4 6.5C4 5.11929 5.11929 4 6.5 4H17.5C18.8807 4 20 5.11929 20 6.5V13.5C20 14.8807 18.8807 16 17.5 16H10L6 20V16H6.5C5.11929 16 4 14.8807 4 13.5V6.5Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>\
              <circle cx="9" cy="9" r="0.9" fill="currentColor"/><circle cx="12.5" cy="9" r="0.9" fill="currentColor"/><circle cx="16" cy="9" r="0.9" fill="currentColor"/>\
            </svg>';

        const unread = document.createElement('span');
        unread.className = 'palompy-unread-badge';
        unread.textContent = '0';
        unread.hidden = true;

        toggle.appendChild(icon);
        toggle.appendChild(unread);

        // Само окно
        const windowEl = document.createElement('section');
        windowEl.className = 'palompy-chat-window hidden';
        windowEl.setAttribute('role', 'dialog');
        windowEl.setAttribute('aria-label', texts.headerTitle);

        // Header
        const header = document.createElement('header');
        header.className = 'palompy-chat-header';

        const headerMain = document.createElement('div');
        headerMain.className = 'palompy-chat-header-main';

        const title = document.createElement('h4');
        title.textContent = texts.headerTitle;

        const subtitleRow = document.createElement('div');
        subtitleRow.className = 'palompy-chat-header-subrow';

        const subtitle = document.createElement('span');
        subtitle.className = 'palompy-chat-subtitle';
        subtitle.textContent = texts.headerSubtitle;

        const statusChip = document.createElement('span');
        statusChip.className = 'palompy-status-chip';
        statusChip.textContent = texts.statusShort.ready;

        subtitleRow.appendChild(subtitle);
        subtitleRow.appendChild(statusChip);

        headerMain.appendChild(title);
        headerMain.appendChild(subtitleRow);

        const headerActions = document.createElement('div');
        headerActions.className = 'palompy-chat-header-actions';

        const statusDot = document.createElement('span');
        statusDot.className = 'palompy-status-dot';
        statusDot.dataset.state = 'ready';

        const sizeToggle = document.createElement('button');
        sizeToggle.type = 'button';
        sizeToggle.className = 'palompy-size-toggle';
        sizeToggle.setAttribute('aria-label', 'Toggle chat width');
        sizeToggle.innerHTML =
            '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">\
              <path d="M10 7H6V17H10M14 7H18V17H14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>\
            </svg>';

        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'palompy-close';
        close.setAttribute('aria-label', 'Close chat');
        close.innerHTML =
            '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">\
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>\
            </svg>';

        headerActions.appendChild(statusDot);
        headerActions.appendChild(sizeToggle);
        headerActions.appendChild(close);

        header.appendChild(headerMain);
        header.appendChild(headerActions);

        // Тело чата
        const body = document.createElement('div');
        body.className = 'palompy-chat-body';

        const messages = document.createElement('div');
        messages.className = 'palompy-chat-messages';
        messages.setAttribute('role', 'log');
        messages.setAttribute('aria-live', 'polite');

        // Быстрые подсказки
        const quickWrapper = document.createElement('div');
        quickWrapper.className = 'palompy-quick-prompts';

        const quickLabel = document.createElement('p');
        quickLabel.textContent = '';

        const quickGrid = document.createElement('div');
        quickGrid.className = 'palompy-quick-grid';

        const quickButtons = [];

        if (quickPrompts && quickPrompts.length) {
            quickLabel.textContent = '';
            quickPrompts.forEach((prompt) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'palompy-quick-button';
                button.textContent = prompt;
                button.dataset.prompt = prompt;
                quickGrid.appendChild(button);
                quickButtons.push(button);
            });
            quickWrapper.appendChild(quickGrid);
        }

        body.appendChild(messages);
        if (quickButtons.length) {
            body.appendChild(quickWrapper);
        }

        // Инпут
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'palompy-chat-input';

        const form = document.createElement('form');
        form.className = 'palompy-chat-form';

        const textarea = document.createElement('textarea');
        textarea.placeholder = texts.placeholder;
        textarea.required = true;
        textarea.rows = 2;

        const submit = document.createElement('button');
        submit.type = 'submit';
        submit.className = 'palompy-chat-send';
        submit.innerHTML =
            '<span>' +
            texts.send +
            '</span>' +
            '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">\
              <path d="M5 12L4 5L20 12L4 19L5 12Z" fill="currentColor" />\
            </svg>';

        form.appendChild(textarea);
        form.appendChild(submit);

        const statusText = document.createElement('div');
        statusText.className = 'palompy-chat-status-line';
        statusText.textContent = texts.statusDetail.ready;

        inputWrapper.appendChild(form);
        inputWrapper.appendChild(statusText);

        windowEl.appendChild(header);
        windowEl.appendChild(body);
        windowEl.appendChild(inputWrapper);

        document.body.appendChild(windowEl);
        document.body.appendChild(toggle);

        return {
            toggle,
            unread,
            window: windowEl,
            messages,
            form,
            textarea,
            statusText,
            statusDot,
            statusChip,
            sizeToggle,
            close,
            quickPromptButtons: quickButtons,
        };
    }

    function parsePrompts(raw) {
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed.map((item) => String(item)).filter(Boolean);
            }
        } catch (_error) {
            // ignore JSON errors
        }
        return raw
            .split(/[,|]/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    function getOrCreateSession(key) {
        try {
            const existing = localStorage.getItem(key);
            if (existing) return existing;
            const fresh = crypto.randomUUID();
            localStorage.setItem(key, fresh);
            return fresh;
        } catch (_error) {
            return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        }
    }

    function injectStylesheet(scriptSrc) {
        const existing = document.querySelector('link[data-palompy-widget="styles"]');
        if (existing) return;
        const cssUrl = (() => {
            try {
                const url = new URL(scriptSrc, window.location.href);
                url.pathname = url.pathname.replace(/widget\.js$/, 'widget.css');
                return url.toString();
            } catch (_error) {
                return scriptSrc.replace('widget.js', 'widget.css');
            }
        })();
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssUrl;
        link.setAttribute('data-palompy-widget', 'styles');
        document.head.appendChild(link);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
