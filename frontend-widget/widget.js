(function () {
  const script = document.currentScript;
  if (!script) {
    console.error('[palompy] Unable to locate current script tag.');
    return;
  }

  const translations = {
    ru: {
      toggleLabel: 'Открыть чат с ассистентом',
      headerTitle: 'AI ассистент',
      headerSubtitle: 'Отвечаем 24/7',
      heroHighlight: 'Ваш личный консультант',
      heroBody: 'Подбираем товары, отслеживаем наличие и рассказываем про доставку.',
      welcome: 'Здравствуйте! Я помогу рассказать про доставку, наличие и акции магазина.',
      placeholder: 'Напишите вопрос…',
      send: 'Отправить',
      quickPromptsLabel: 'Попробуйте спросить:',
      quickPromptDefaults: ['Расскажите про доставку', 'Какие акции есть?', 'Помогите выбрать товар'],
      statusShort: {
        ready: 'Онлайн',
        connecting: 'Ищем ответ…',
        offline: 'Нет соединения',
      },
      statusDetail: {
        ready: 'Готов ответить на новые вопросы.',
        connecting: 'Соединяемся с ассистентом…',
        offline: 'Извините, сервис временно недоступен. Попробуйте позже.',
      },
      fallbackAnswer: 'Нет ответа, попробуйте позже.',
      errorAnswer: 'Извините, сервис временно недоступен. Попробуйте позже.',
      perksLabel: 'Почему это удобно',
      perks: [
        { icon: '⚡', title: 'Быстрый ответ', description: 'Ответ в течение нескольких секунд.' },
        { icon: '🛍️', title: 'Персональные советы', description: 'Подберём товары под ваши задачи.' },
        { icon: '🌙', title: '24/7 поддержка', description: 'Помощь даже ночью и в выходные.' },
      ],
      feedback: {
        title: 'Как вам сайт?',
        ask: 'Расскажите, что понравилось или чего не хватает. Это поможет нам стать лучше.',
        like: 'Все нравится 👍',
        dislike: 'Нужно улучшить 👎',
        thanks: 'Спасибо за отзыв! Мы уже работаем над улучшениями.',
      },
      survey: {
        title: 'Минутный опрос',
        description: 'Ответьте на пару вопросов и помогите сделать сервис лучше.',
        cta: 'Отправить ответы',
        skip: 'Скрыть',
        sending: 'Сохраняем ответы…',
        success: 'Спасибо! Ответы сохранены.',
        error: 'Не удалось отправить ответы. Попробуйте позже.',
        requiredWarning: 'Пожалуйста, ответьте на обязательные вопросы.',
        optionalLabel: 'необязательно',
      },
      scenarioDefaults: {
        'cart-abandon': {
          botMessage: 'Вы собирались оформить заказ. Подсказать по доставке или оплате?',
          prefill: 'Нужна помощь с оформлением заказа.',
          selector: '[data-palompy-trigger="cart-abandon"]',
        },
        'cancel-item': {
          botMessage: 'Товар не подошёл? Могу подсказать замену или оформить возврат.',
          prefill: 'Хочу отменить товар и подобрать альтернативу.',
          selector: '[data-palompy-trigger="cancel-item"]',
        },
        'checkout-help': {
          botMessage: 'Готов помочь с оформлением, промокодом или доставкой.',
          prefill: 'Подскажите, как завершить оформление.',
          selector: '[data-palompy-trigger="checkout-help"]',
        },
        'exit-intent': {
          botMessage: 'Перед уходом могу подсказать акции и бонусы. Что смущает?',
          event: 'exit-intent',
        },
        feedback: {
          botMessage: 'Что вам нравится или не нравится в нашем сервисе?',
        },
      },
    },
    en: {
      toggleLabel: 'Open assistant chat',
      headerTitle: 'AI assistant',
      headerSubtitle: 'Here for you 24/7',
      heroHighlight: 'Your personal concierge',
      heroBody: 'We track availability, shipping and recommend products for you.',
      welcome: 'Hi! I can help you with shipping, availability, and product questions.',
      placeholder: 'Type your question…',
      send: 'Send',
      quickPromptsLabel: 'Try asking:',
      quickPromptDefaults: ['Tell me about shipping', 'What promotions are running?', 'Help me pick a product'],
      statusShort: {
        ready: 'Online',
        connecting: 'Finding an answer…',
        offline: 'Offline',
      },
      statusDetail: {
        ready: 'Ready for your next question.',
        connecting: 'Talking to the assistant…',
        offline: 'Sorry, the service is unavailable. Please try again later.',
      },
      fallbackAnswer: 'No answer yet, please try again later.',
      errorAnswer: 'Sorry, something went wrong. Please try again later.',
      perksLabel: 'Why shoppers love it',
      perks: [
        { icon: '⚡', title: 'Lightning fast', description: 'Answers arrive in seconds.' },
        { icon: '🛒', title: 'Personal touch', description: 'Recommendations tailored to you.' },
        { icon: '🌙', title: 'Always on', description: '24/7 coverage for every timezone.' },
      ],
      feedback: {
        title: 'How is your experience?',
        ask: 'Share what you enjoy or what should improve—we read every response.',
        like: 'Loving it 👍',
        dislike: 'Needs work 👎',
        thanks: 'Thank you! Your feedback helps us improve.',
      },
      survey: {
        title: 'One-minute survey',
        description: 'Answer a couple of questions to help us improve.',
        cta: 'Send feedback',
        skip: 'Hide survey',
        sending: 'Saving your answers…',
        success: 'Thanks! Your response is saved.',
        error: 'Unable to send answers right now. Please try later.',
        requiredWarning: 'Please fill in the required questions.',
        optionalLabel: 'optional',
      },
      scenarioDefaults: {
        'cart-abandon': {
          botMessage: 'You were close to completing the order. Need help with shipping or payment?',
          prefill: 'I need help finalizing my order.',
          selector: '[data-palompy-trigger="cart-abandon"]',
        },
        'cancel-item': {
          botMessage: 'Something didn’t work out with the product? I can suggest alternatives or help with returns.',
          prefill: 'I want to cancel an item and find an alternative.',
          selector: '[data-palompy-trigger="cancel-item"]',
        },
        'checkout-help': {
          botMessage: 'Happy to guide you through checkout, promo codes or delivery.',
          prefill: 'I have a checkout question.',
          selector: '[data-palompy-trigger="checkout-help"]',
        },
        'exit-intent': {
          botMessage: 'Before you go, can I share current deals or answer a question?',
          event: 'exit-intent',
        },
        feedback: {
          botMessage: 'What do you like or dislike about our store?',
        },
      },
    },
  };

  function resolveLanguage() {
    const attr = (script.dataset.lang || '').toLowerCase();
    if (attr.startsWith('ru')) return 'ru';
    if (attr.startsWith('en')) return 'en';
    if (navigator.language && navigator.language.toLowerCase().startsWith('ru')) {
      return 'ru';
    }
    return 'en';
  }

  function init() {
    const shopPublicKey = script.dataset.shopId;
    if (!shopPublicKey) {
      console.error('[palompy] data-shop-id attribute is required.');
      return;
    }

    const language = resolveLanguage();
    const texts = translations[language];
    const apiBase = script.dataset.apiBase || new URL(script.src, window.location.href).origin;
    const normalizedBase = apiBase.replace(/\/$/, '');
    const chatEndpoint = `${normalizedBase}/api/chat`;
    const analyticsEndpoint = `${normalizedBase}/api/analytics/events`;
    const surveyLookupEndpoint = `${normalizedBase}/api/shops/public/${shopPublicKey}/surveys/active`;
    const surveyResponsesEndpoint = `${normalizedBase}/api/surveys`;
    injectStylesheet(script.src);

    const sessionKey = `palompy_session_${shopPublicKey}`;
    const sessionId = getOrCreateSession(sessionKey);
    const quickPrompts = parsePrompts(script.dataset.prompts) ?? texts.quickPromptDefaults;
    const perks = parsePerks(script.dataset.perks, texts.perks);
    const scenarioMap = buildScenarioMap(script.dataset.scenarios, texts.scenarioDefaults);

    const state = {
      isOpen: false,
      isSending: false,
      unread: 0,
    };

    const analyticsState = {
      sessionStartedAt: Date.now(),
      visibleStartedAt: document.hidden ? null : Date.now(),
      focusedMs: 0,
    };

    const leadSubscribers = new Set();

    function notifyLead(detail) {
      const payload = { ...detail };
      leadSubscribers.forEach((listener) => {
        try {
          listener(payload);
        } catch (error) {
          console.error('[palompy] onLead listener failed', error);
        }
      });
      try {
        document.dispatchEvent(
          new CustomEvent('palompy:lead', {
            detail: payload,
          }),
        );
      } catch (error) {
        console.error('[palompy] unable to dispatch lead event', error);
      }
    }

    function normalizeLeadPayload(raw) {
      if (!raw || typeof raw !== 'object') {
        return null;
      }
      const record = raw;
      const normalized = {
        name: coerceLeadValue(record.name),
        email: coerceLeadValue(record.email),
        phone: coerceLeadValue(record.phone),
        intent: coerceLeadValue(record.intent || record.goal),
        orderNumber: coerceLeadValue(record.orderNumber || record.order_number),
        preferredContact: coerceLeadValue(record.preferredContact || record.preferred_contact),
        notes: coerceLeadValue(record.notes),
      };
      if (Object.values(normalized).every((value) => !value)) {
        return null;
      }
      return normalized;
    }

    function coerceLeadValue(value) {
      if (typeof value !== 'string') {
        return null;
      }
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    }

    function trackEvent(eventName, metadata = {}, options = {}) {
      const meta = metadata && typeof metadata === 'object' ? { ...metadata } : {};
      if (!('language' in meta)) {
        meta.language = language;
      }
      if (!('page' in meta)) {
        meta.page = window.location.href;
      }
      const body = JSON.stringify({
        shopPublicKey,
        sessionId,
        eventName,
        metadata: meta,
      });
      if (options.immediate && navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(analyticsEndpoint, blob);
        return;
      }
      fetch(analyticsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: options.immediate === true,
      }).catch((error) => {
        console.warn('[palompy] analytics error', error);
      });
    }

    function updateVisibleTime() {
      if (document.hidden && analyticsState.visibleStartedAt) {
        analyticsState.focusedMs += Date.now() - analyticsState.visibleStartedAt;
        analyticsState.visibleStartedAt = null;
      } else if (!document.hidden && analyticsState.visibleStartedAt === null) {
        analyticsState.visibleStartedAt = Date.now();
      }
    }

    function flushSessionDuration(immediate = false) {
      updateVisibleTime();
      const durationMs = Date.now() - analyticsState.sessionStartedAt;
      trackEvent(
        'session_duration',
        { durationMs, focusedMs: analyticsState.focusedMs },
        { immediate },
      );
    }

    document.addEventListener('visibilitychange', () => {
      updateVisibleTime();
      trackEvent(document.hidden ? 'page_hidden' : 'page_visible');
    });

    window.addEventListener('beforeunload', () => {
      flushSessionDuration(true);
    });

    const elements = buildWidget(texts, quickPrompts, perks);
    appendMessage(texts.welcome, 'bot');
    updateStatus('ready');

    const surveyState = {
      current: null,
      isSubmitting: false,
    };

    if (elements.survey) {
      void loadActiveSurvey();
    }

    trackEvent('widget_init', { referrer: document.referrer || undefined });
    trackEvent('page_view', { referrer: document.referrer || undefined });

    const triggerScenario = createScenarioHandler({
      elements,
      scenarioMap,
      autoResizeTextArea,
      toggleWindow,
      texts,
      appendMessage,
      trackEvent,
    });

    setupScenarioAutomation({ scenarioMap, triggerScenario });
    setupExitIntent({ scenarioMap, triggerScenario });
    setupFeedbackPulse({ elements, texts, triggerScenario });
    exposePublicAPI({
      toggleWindow,
      handleSend,
      triggerScenario,
      scenarioMap,
      appendMessage,
      leadSubscribers,
    });

    elements.toggle.addEventListener('click', () => {
      trackEvent('toggle_click', { next: state.isOpen ? 'close' : 'open' });
      toggleWindow(!state.isOpen);
    });

    elements.close.addEventListener('click', () => toggleWindow(false));

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

    elements.quickPromptButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const prompt = btn.dataset.prompt || '';
        trackEvent('quick_prompt_click', { prompt, index, label: prompt });
        toggleWindow(true);
        void handleSend(prompt);
      });
    });

    elements.feedbackButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        elements.feedbackBar.dataset.state = 'submitted';
        elements.feedbackLabel.textContent = texts.feedback.thanks;
        const prompt = btn.dataset.prompt;
        trackEvent('feedback_vote', {
          prompt,
          label: prompt,
          sentiment: index === 0 ? 'positive' : 'negative',
        });
        if (prompt) {
          toggleWindow(true);
          void handleSend(prompt);
        }
      });
    });

    autoResizeTextArea();

    function toggleWindow(open) {
      const previous = state.isOpen;
      state.isOpen = open;
      elements.window.classList.toggle('hidden', !state.isOpen);
      elements.toggle.setAttribute('aria-expanded', String(state.isOpen));
      if (state.isOpen) {
        resetUnread();
        elements.textarea.focus();
      }
      if (previous !== open) {
        trackEvent('widget_toggle', { state: open ? 'opened' : 'closed' });
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
    }

    function bumpUnread() {
      state.unread += 1;
      elements.unread.textContent = String(state.unread);
      elements.unread.hidden = false;
    }

    async function loadActiveSurvey() {
      if (!elements.survey) return;
      try {
        const response = await fetch(surveyLookupEndpoint);
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        const survey = data?.survey;
        if (survey && survey.definition?.questions?.length) {
          surveyState.current = survey;
          renderSurveyCard(survey);
          trackEvent('survey_view', { surveyId: survey.id });
        }
      } catch (error) {
        console.warn('[palompy] survey load failed', error);
      }
    }

    function renderSurveyCard(survey) {
      const container = elements.survey;
      if (!container) return;
      const questions = survey.definition?.questions || [];
      if (!questions.length) {
        container.hidden = true;
        return;
      }
      container.hidden = false;
      container.innerHTML = '';
      container.dataset.state = 'ready';

      const title = document.createElement('h5');
      title.textContent = survey.title || texts.survey.title;
      container.appendChild(title);

      const description = document.createElement('p');
      description.className = 'palompy-survey-description';
      description.textContent = survey.description || texts.survey.description;
      container.appendChild(description);

      const form = document.createElement('form');
      form.className = 'palompy-survey-form';

      const questionsWrapper = document.createElement('div');
      questionsWrapper.className = 'palompy-survey-questions';

      questions.forEach((question) => {
        const node = buildSurveyQuestion(question);
        if (node) {
          questionsWrapper.appendChild(node);
        }
      });

      const footer = document.createElement('div');
      footer.className = 'palompy-survey-footer';

      const skipButton = document.createElement('button');
      skipButton.type = 'button';
      skipButton.className = 'palompy-survey-skip';
      skipButton.textContent = texts.survey.skip;

      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.className = 'palompy-survey-submit';
      submitButton.textContent = texts.survey.cta;

      const status = document.createElement('p');
      status.className = 'palompy-survey-status';

      footer.appendChild(skipButton);
      footer.appendChild(submitButton);

      form.appendChild(questionsWrapper);
      form.appendChild(footer);
      form.appendChild(status);

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        void submitSurveyForm(form, submitButton, status);
      });

      skipButton.addEventListener('click', () => {
        container.hidden = true;
        surveyState.current = null;
        trackEvent('survey_skip', { surveyId: survey.id });
      });

      container.appendChild(form);
    }

    function buildSurveyQuestion(question) {
      if (!question || !question.id || !question.prompt) {
        return null;
      }
      const wrapper = document.createElement('div');
      wrapper.className = 'palompy-survey-question';
      const title = document.createElement('p');
      title.className = 'palompy-survey-question-title';
      title.textContent = question.prompt;
      if (!question.required && texts.survey.optionalLabel) {
        const optional = document.createElement('span');
        optional.className = 'palompy-survey-optional';
        optional.textContent = texts.survey.optionalLabel;
        title.appendChild(optional);
      }
      wrapper.appendChild(title);

      if (question.type === 'text') {
        const textarea = document.createElement('textarea');
        textarea.name = question.id;
        textarea.rows = 3;
        if (question.required) {
          textarea.required = true;
        }
        wrapper.appendChild(textarea);
        return wrapper;
      }

      const options = question.options || [];
      if (!options.length) {
        return null;
      }
      const optionsWrapper = document.createElement('div');
      optionsWrapper.className = 'palompy-survey-options';

      options.forEach((option, index) => {
        const optionId = `palompy-${question.id}-${option.id || index}`;
        const optionLabel = document.createElement('label');
        optionLabel.className = 'palompy-survey-option';
        optionLabel.setAttribute('for', optionId);

        const labelText = option.label || option.id || String(index + 1);

        const input = document.createElement('input');
        input.type = question.type === 'multi-choice' ? 'checkbox' : 'radio';
        input.name = question.id;
        input.id = optionId;
        input.value = option.id || option.label || String(index);
        if (question.required && question.type !== 'multi-choice') {
          input.required = true;
        }
        input.addEventListener('change', () => {
          trackEvent('survey_option_click', {
            questionId: question.id,
            optionId: input.value,
            label: labelText,
          });
        });

        const text = document.createElement('span');
        text.textContent = labelText;

        optionLabel.appendChild(input);
        optionLabel.appendChild(text);
        optionsWrapper.appendChild(optionLabel);
      });

      wrapper.appendChild(optionsWrapper);
      return wrapper;
    }

    async function submitSurveyForm(form, submitButton, statusEl) {
      const survey = surveyState.current;
      const container = elements.survey;
      if (!survey || !container || surveyState.isSubmitting) {
        return;
      }
      const questions = survey.definition?.questions || [];
      const formData = new FormData(form);
      const answers = {};
      const missing = [];
      questions.forEach((question) => {
        if (!question || !question.id) return;
        if (question.type === 'multi-choice') {
          const values = formData
            .getAll(question.id)
            .map((value) => String(value))
            .filter(Boolean);
          if (values.length) {
            answers[question.id] = values;
          }
          if (question.required && values.length === 0) {
            missing.push(question.id);
          }
          return;
        }
        const value = formData.get(question.id);
        const normalized = value ? String(value).trim() : '';
        if (normalized) {
          answers[question.id] = normalized;
        }
        if (question.required && !normalized) {
          missing.push(question.id);
        }
      });

      if (missing.length || !Object.keys(answers).length) {
        statusEl.textContent = texts.survey.requiredWarning;
        statusEl.dataset.state = 'error';
        return;
      }

      surveyState.isSubmitting = true;
      submitButton.disabled = true;
      statusEl.textContent = texts.survey.sending;
      statusEl.dataset.state = 'pending';

      try {
        const focusedMsSnapshot =
          analyticsState.focusedMs +
          (analyticsState.visibleStartedAt ? Date.now() - analyticsState.visibleStartedAt : 0);
        const response = await fetch(`${surveyResponsesEndpoint}/${survey.id}/responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            answers,
            metadata: {
              language,
              page: window.location.href,
              focusedMs: focusedMsSnapshot,
            },
          }),
        });
        if (!response.ok) {
          throw new Error(`Network error: ${response.status}`);
        }
        container.dataset.state = 'submitted';
        container.innerHTML = '';
        const success = document.createElement('p');
        success.className = 'palompy-survey-success';
        success.textContent = texts.survey.success;
        container.appendChild(success);
        surveyState.current = null;
        trackEvent('survey_submit', {
          surveyId: survey.id,
          answersCount: Object.keys(answers).length,
        });
      } catch (error) {
        console.error('[palompy] survey submit failed', error);
        statusEl.textContent = texts.survey.error;
        statusEl.dataset.state = 'error';
        submitButton.disabled = false;
        trackEvent('survey_error', { surveyId: survey.id });
      } finally {
        surveyState.isSubmitting = false;
      }
    }

    async function handleSend(prefilledMessage) {
      if (state.isSending) return;
      const message = (prefilledMessage ?? elements.textarea.value).trim();
      if (!message) return;

      appendMessage(message, 'user');
      elements.textarea.value = '';
      autoResizeTextArea();

      trackEvent('message_sent', { length: message.length, prefilled: Boolean(prefilledMessage) });

      state.isSending = true;
      updateStatus('connecting');

      let encounteredError = false;

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
        trackEvent('message_answered', { length: answer.length });
        const leadPayload = normalizeLeadPayload(data.collectedData);
        if (leadPayload) {
          const detail = {
            ...leadPayload,
            sessionId,
            pageUrl: window.location.href,
            answer,
            message,
            timestamp: new Date().toISOString(),
          };
          notifyLead(detail);
          trackEvent('lead_collected', {
            hasContact: Boolean(leadPayload.email || leadPayload.phone),
            intent: leadPayload.intent || undefined,
          });
        }
      } catch (error) {
        encounteredError = true;
        console.error('[palompy] chat error', error);
        appendMessage(texts.errorAnswer, 'bot');
        updateStatus('offline');
        trackEvent('message_failed', { reason: error instanceof Error ? error.message : 'unknown' });
      } finally {
        state.isSending = false;
        if (!encounteredError) {
          updateStatus('ready');
        }
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
      elements.status.textContent = texts.statusDetail[statusKey];
      elements.statusDot.dataset.state = statusKey;
      elements.statusDot.setAttribute('title', texts.statusShort[statusKey]);
    }

    function buildWidget(texts, quickPrompts, perks) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'palompy-chat-toggle';
      toggle.setAttribute('aria-label', texts.toggleLabel);
      toggle.setAttribute('aria-expanded', 'false');

      const icon = document.createElement('span');
      icon.className = 'palompy-toggle-icon';
      icon.innerHTML =
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\
          <path d="M4 5.5C4 4.11929 5.11929 3 6.5 3H17.5C18.8807 3 20 4.11929 20 5.5V12.5C20 13.8807 18.8807 15 17.5 15H9.41421L5.70711 18.7071C5.07714 19.3371 4 18.8906 4 17.9922V5.5Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>\
          <circle cx="8" cy="8.25" r="0.75" fill="currentColor"/>\
          <circle cx="12" cy="8.25" r="0.75" fill="currentColor"/>\
          <circle cx="16" cy="8.25" r="0.75" fill="currentColor"/>\
        </svg>';

      const unread = document.createElement('span');
      unread.className = 'palompy-unread-badge';
      unread.textContent = '0';
      unread.hidden = true;

      toggle.appendChild(icon);
      toggle.appendChild(unread);

      const windowEl = document.createElement('section');
      windowEl.className = 'palompy-chat-window hidden';
      windowEl.setAttribute('role', 'dialog');
      windowEl.setAttribute('aria-label', texts.headerTitle);

      const header = document.createElement('header');
      header.className = 'palompy-chat-header';

      const headerText = document.createElement('div');
      headerText.className = 'palompy-chat-header-text';

      const title = document.createElement('h4');
      title.textContent = texts.headerTitle;

      const subtitle = document.createElement('p');
      subtitle.textContent = texts.headerSubtitle;

      const hero = document.createElement('div');
      hero.className = 'palompy-hero';

      const heroHighlight = document.createElement('strong');
      heroHighlight.textContent = texts.heroHighlight;

      const heroBody = document.createElement('span');
      heroBody.textContent = texts.heroBody;

      hero.appendChild(heroHighlight);
      hero.appendChild(heroBody);

      headerText.appendChild(title);
      headerText.appendChild(subtitle);
      headerText.appendChild(hero);

      const headerActions = document.createElement('div');
      headerActions.className = 'palompy-chat-header-actions';

      const statusDot = document.createElement('span');
      statusDot.className = 'palompy-status-dot';
      statusDot.dataset.state = 'ready';

      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'palompy-close';
      close.setAttribute('aria-label', texts.toggleLabel);
      close.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\
          <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>\
        </svg>';

      headerActions.appendChild(statusDot);
      headerActions.appendChild(close);

      header.appendChild(headerText);
      header.appendChild(headerActions);

      const perksWrapper = document.createElement('div');
      perksWrapper.className = 'palompy-perks';
      const perksLabel = document.createElement('p');
      perksLabel.textContent = texts.perksLabel;
      const perksList = document.createElement('div');
      perksList.className = 'palompy-perks-grid';
      perks.forEach((perk) => {
        const card = document.createElement('article');
        card.className = 'palompy-perk-card';
        const iconEl = document.createElement('span');
        iconEl.className = 'palompy-perk-icon';
        iconEl.textContent = perk.icon || '✨';
        const titleEl = document.createElement('h5');
        titleEl.textContent = perk.title;
        const descEl = document.createElement('p');
        descEl.textContent = perk.description;
        card.appendChild(iconEl);
        card.appendChild(titleEl);
        card.appendChild(descEl);
        perksList.appendChild(card);
      });
      perksWrapper.appendChild(perksLabel);
      perksWrapper.appendChild(perksList);

      const messages = document.createElement('div');
      messages.className = 'palompy-chat-messages';
      messages.setAttribute('role', 'log');
      messages.setAttribute('aria-live', 'polite');

      const content = document.createElement('div');
      content.className = 'palompy-chat-content';

      const quickPromptWrapper = document.createElement('div');
      quickPromptWrapper.className = 'palompy-quick-prompts';

      if (quickPrompts.length) {
        const quickLabel = document.createElement('p');
        quickLabel.textContent = texts.quickPromptsLabel;
        const quickGrid = document.createElement('div');
        quickGrid.className = 'palompy-quick-grid';

        quickPrompts.forEach((prompt) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'palompy-quick-button';
          button.textContent = prompt;
          button.dataset.prompt = prompt;
          quickGrid.appendChild(button);
        });

        quickPromptWrapper.appendChild(quickLabel);
        quickPromptWrapper.appendChild(quickGrid);
      }

      const surveyWrapper = document.createElement('div');
      surveyWrapper.className = 'palompy-survey';
      surveyWrapper.hidden = true;

      const feedbackBar = document.createElement('div');
      feedbackBar.className = 'palompy-feedback';
      feedbackBar.hidden = true;
      const feedbackTitle = document.createElement('p');
      feedbackTitle.className = 'palompy-feedback-title';
      feedbackTitle.textContent = texts.feedback.title;
      const feedbackLabel = document.createElement('span');
      feedbackLabel.className = 'palompy-feedback-label';
      feedbackLabel.textContent = texts.feedback.ask;
      const feedbackButtonsWrap = document.createElement('div');
      feedbackButtonsWrap.className = 'palompy-feedback-buttons';
      const likeBtn = document.createElement('button');
      likeBtn.type = 'button';
      likeBtn.className = 'palompy-feedback-button';
      likeBtn.dataset.prompt = texts.feedback.like;
      likeBtn.textContent = texts.feedback.like;
      const dislikeBtn = document.createElement('button');
      dislikeBtn.type = 'button';
      dislikeBtn.className = 'palompy-feedback-button';
      dislikeBtn.dataset.prompt = texts.feedback.dislike;
      dislikeBtn.textContent = texts.feedback.dislike;
      feedbackButtonsWrap.appendChild(likeBtn);
      feedbackButtonsWrap.appendChild(dislikeBtn);
      feedbackBar.appendChild(feedbackTitle);
      feedbackBar.appendChild(feedbackLabel);
      feedbackBar.appendChild(feedbackButtonsWrap);

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
      submit.textContent = texts.send;

      form.appendChild(textarea);
      form.appendChild(submit);

      const status = document.createElement('div');
      status.className = 'palompy-chat-status';
      status.textContent = texts.statusDetail.ready;

      inputWrapper.appendChild(form);
      inputWrapper.appendChild(status);

      windowEl.appendChild(header);
      if (perks.length) {
        content.appendChild(perksWrapper);
      }
      content.appendChild(messages);
      if (quickPrompts.length) {
        content.appendChild(quickPromptWrapper);
      }
      content.appendChild(surveyWrapper);
      content.appendChild(feedbackBar);
      windowEl.appendChild(content);
      windowEl.appendChild(inputWrapper);

      document.body.appendChild(windowEl);
      document.body.appendChild(toggle);

      const quickPromptButtons = Array.from(
        quickPromptWrapper.querySelectorAll('button.palompy-quick-button'),
      );

      return {
        toggle,
        unread,
        window: windowEl,
        form,
        textarea,
        status,
        messages,
        quickPromptButtons,
        statusDot,
        close,
        feedbackBar,
        feedbackButtons: [likeBtn, dislikeBtn],
        feedbackLabel,
        survey: surveyWrapper,
      };
    }
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

  function parsePerks(raw, defaults) {
    const parsed = parseJSON(raw);
    if (!parsed) return defaults;
    if (Array.isArray(parsed)) {
      const normalized = parsed
        .map((item) => {
          if (typeof item === 'string') {
            return { title: item, description: '', icon: '✨' };
          }
          if (item && typeof item === 'object') {
            return {
              title: String(item.title || ''),
              description: String(item.description || ''),
              icon: item.icon ? String(item.icon) : '✨',
            };
          }
          return null;
        })
        .filter((item) => item && item.title);
      return normalized.length ? normalized : defaults;
    }
    return defaults;
  }

  function parseJSON(raw) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  }

  function buildScenarioMap(raw, defaults) {
    const map = new Map();
    Object.entries(defaults || {}).forEach(([key, config]) => {
      map.set(key, {
        key,
        open: true,
        focus: true,
        event: 'click',
        ...config,
      });
    });
    const parsed = parseJSON(raw);
    if (Array.isArray(parsed)) {
      parsed.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const key = item.key || item.id;
        if (!key) return;
        const existing = map.get(key) || { key };
        map.set(key, { ...existing, ...item });
      });
    } else if (parsed && typeof parsed === 'object') {
      Object.entries(parsed).forEach(([key, value]) => {
        if (!value || typeof value !== 'object') return;
        const existing = map.get(key) || { key };
        map.set(key, { ...existing, ...value });
      });
    }
    return map;
  }

  function createScenarioHandler({
    elements,
    scenarioMap,
    autoResizeTextArea,
    toggleWindow,
    texts,
    appendMessage,
    trackEvent,
  }) {
    return function triggerScenario(key, overrideMessage) {
      const scenario = scenarioMap.get(key);
      if (!scenario) {
        if (typeof overrideMessage === 'string' && overrideMessage.trim()) {
          appendMessage(overrideMessage, 'bot');
        }
        return;
      }

      if (typeof trackEvent === 'function') {
        trackEvent('scenario_trigger', { key: scenario.key });
      }

      if (scenario.open !== false) {
        toggleWindow(true);
      }
      const message = overrideMessage || scenario.botMessage;
      if (message) {
        appendMessage(message, 'bot');
      }
      if (scenario.prefill) {
        elements.textarea.value = scenario.prefill;
        autoResizeTextArea();
      }
      if (scenario.focus !== false) {
        elements.textarea.focus();
      }
      if (scenario.key === 'feedback') {
        elements.feedbackBar.hidden = false;
        elements.feedbackBar.classList.add('visible');
        elements.feedbackBar.dataset.state = 'asking';
        elements.feedbackLabel.textContent = texts.feedback.ask;
      }
    };
  }

  function setupScenarioAutomation({ scenarioMap, triggerScenario }) {
    const clickableScenarios = Array.from(scenarioMap.values()).filter(
      (scenario) => (scenario.selector || scenario.key) && scenario.event !== 'exit-intent',
    );
    if (clickableScenarios.length) {
      const bound = new WeakSet();
      const bindSelectors = () => {
        clickableScenarios.forEach((scenario) => {
          const selectors = [];
          if (scenario.selector) selectors.push(scenario.selector);
          if (scenario.key) selectors.push(`[data-palompy-trigger~="${scenario.key}"]`);
          selectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach((element) => {
              if (bound.has(element)) return;
              const eventName = scenario.event || 'click';
              element.addEventListener(eventName, () => triggerScenario(scenario.key));
              bound.add(element);
            });
          });
        });
      };
      bindSelectors();
      const observer = new MutationObserver(bindSelectors);
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    document.addEventListener('palompy:trigger', (event) => {
      const detail = event.detail || {};
      if (detail.key || detail.message) {
        triggerScenario(detail.key || '__custom__', detail.message);
      }
    });
  }

  function setupExitIntent({ scenarioMap, triggerScenario }) {
    const exitScenario = scenarioMap.get('exit-intent');
    if (!exitScenario || exitScenario.event !== 'exit-intent') return;
    let fired = false;
    function handleExitIntent(event) {
      if (fired) return;
      if (!event.relatedTarget && event.clientY <= 0) {
        fired = true;
        triggerScenario('exit-intent');
        document.removeEventListener('mouseout', handleExitIntent);
      }
    }
    document.addEventListener('mouseout', handleExitIntent);
  }

  function setupFeedbackPulse({ elements, texts, triggerScenario }) {
    let asked = false;
    const requestFeedback = () => {
      if (asked) return;
      asked = true;
      triggerScenario('feedback');
    };
    const timeout = window.setTimeout(requestFeedback, 45000);
    elements.window.addEventListener('mouseenter', () => {
      window.clearTimeout(timeout);
    });
    document.addEventListener('palompy:feedback', requestFeedback);
  }

  function exposePublicAPI({
    toggleWindow,
    handleSend,
    triggerScenario,
    scenarioMap,
    appendMessage,
    leadSubscribers,
  }) {
    const api = {
      open: () => toggleWindow(true),
      close: () => toggleWindow(false),
      isOpen: () => document.querySelector('.palompy-chat-window')?.classList.contains('hidden') === false,
      trigger: (keyOrMessage, options = {}) => {
        if (scenarioMap.has(keyOrMessage)) {
          triggerScenario(keyOrMessage, options.message);
          return;
        }
        const message = options.message || keyOrMessage;
        if (!message) return;
        if (options.asBot) {
          appendMessage(String(message), 'bot');
          if (options.open !== false) {
            toggleWindow(true);
          }
          return;
        }
        toggleWindow(true);
        void handleSend(String(message));
      },
      onLead: (listener) => {
        if (typeof listener !== 'function') {
          return () => {};
        }
        leadSubscribers.add(listener);
        return () => {
          leadSubscribers.delete(listener);
        };
      },
    };
    window.PalompyWidget = api;
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
