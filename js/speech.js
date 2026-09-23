/* ============================================================
   SIMULA AI — SPEECH ENGINE

   Reconhecimento de voz + síntese de voz do navegador

   - Português Brasil
   - Turno longo do operador
   - Pausas não enviam a fala
   - 1º clique: começa a ouvir
   - 2º clique: conclui e envia
   - Proteção contra eco
   - Reinício seguro após pausa
   - Voz feminina: Microsoft Maria
   - Voz masculina: Microsoft Daniel
   - Fallback automático para pt-BR
   ============================================================ */

(function () {
    "use strict";

    window.SimulaAI = window.SimulaAI || {};


    // =========================================================
    // ESTADO
    // =========================================================

    const state = {
        recognition: null,

        recognizing: false,
        speaking: false,

        supported: false,
        synthesisSupported: false,

        currentTranscript: "",
        finalTranscript: "",
        interimTranscript: "",

        operatorTurnActive: false,
        accumulatedTranscript: "",

        submitWhenRecognitionEnds: false,

        restartTimer: null,

        voices: [],
        selectedVoice: null
    };


    // =========================================================
    // ELEMENTOS
    // =========================================================

    function getElement(id) {
        return document.getElementById(id);
    }


    // =========================================================
    // LIMPEZA DE TEXTO
    // =========================================================

    function cleanTranscript(text) {
        return String(text || "")
            .replace(/\s+/g, " ")
            .trim();
    }


    // =========================================================
    // SUPORTE
    // =========================================================

    function getSpeechRecognitionClass() {
        return (
            window.SpeechRecognition ||
            window.webkitSpeechRecognition ||
            null
        );
    }


    function checkSupport() {
        const SpeechRecognition =
            getSpeechRecognitionClass();

        state.supported =
            Boolean(SpeechRecognition);

        state.synthesisSupported =
            "speechSynthesis" in window;

        return {
            recognition: state.supported,
            synthesis: state.synthesisSupported
        };
    }


    // =========================================================
    // RECONHECIMENTO DE VOZ
    // =========================================================

    function initializeRecognition() {
        const SpeechRecognition =
            getSpeechRecognitionClass();

        if (!SpeechRecognition) {
            state.supported = false;

            console.warn(
                "Simula AI | Reconhecimento de voz não suportado."
            );

            return false;
        }

        /*
         * Sempre que esta função for chamada,
         * criamos uma instância nova.
         *
         * Isso é importante quando o Chrome encerra
         * internamente uma sessão após uma pausa.
         */
        const recognition =
            new SpeechRecognition();

        state.recognition =
            recognition;

        recognition.lang =
            "pt-BR";

        recognition.continuous =
            true;

        recognition.interimResults =
            true;

        recognition.maxAlternatives =
            3;


        // -----------------------------------------------------
        // RESULTADOS
        // -----------------------------------------------------

        recognition.onresult =
            function (event) {
                /*
                 * Ignora eventos de uma instância antiga.
                 */
                if (
                    state.recognition !==
                    recognition
                ) {
                    return;
                }

                let newFinalText = "";
                let interimText = "";

                for (
                    let i = event.resultIndex;
                    i < event.results.length;
                    i++
                ) {
                    const result =
                        event.results[i];

                    if (
                        !result ||
                        !result[0]
                    ) {
                        continue;
                    }

                    const transcript =
                        cleanTranscript(
                            result[0].transcript || ""
                        );

                    if (!transcript) {
                        continue;
                    }

                    /*
                     * Resultado final do navegador
                     * NÃO encerra o turno.
                     *
                     * Apenas acumulamos.
                     */
                    if (result.isFinal) {
                        newFinalText +=
                            (newFinalText ? " " : "") +
                            transcript;
                    } else {
                        interimText +=
                            (interimText ? " " : "") +
                            transcript;
                    }
                }


                if (newFinalText) {
                    state.accumulatedTranscript =
                        cleanTranscript(
                            state.accumulatedTranscript +
                            " " +
                            newFinalText
                        );
                }


                state.finalTranscript =
                    state.accumulatedTranscript;


                state.interimTranscript =
                    cleanTranscript(
                        interimText
                    );


                state.currentTranscript =
                    cleanTranscript(
                        state.accumulatedTranscript +
                        " " +
                        state.interimTranscript
                    );


                updateTranscriptDisplay();
            };


        // -----------------------------------------------------
        // MICROFONE INICIOU
        // -----------------------------------------------------

        recognition.onstart =
            function () {
                if (
                    state.recognition !==
                    recognition
                ) {
                    return;
                }

                state.recognizing =
                    true;

                updateMicrophoneUI(
                    true
                );

                console.log(
                    "Simula AI | Microfone ativado."
                );
            };


        // -----------------------------------------------------
        // ERROS
        // -----------------------------------------------------

        recognition.onerror =
            function (event) {
                if (
                    state.recognition !==
                    recognition
                ) {
                    return;
                }

                state.recognizing =
                    false;

                const error =
                    event
                        ? event.error
                        : "";


                /*
                 * Ocorre quando desligamos o
                 * reconhecimento propositalmente.
                 */
                if (error === "aborted") {
                    console.log(
                        "Simula AI | Reconhecimento interrompido."
                    );

                    return;
                }


                /*
                 * Em turno longo, no-speech
                 * representa apenas uma pausa.
                 *
                 * O onend fará a recuperação.
                 */
                if (
                    error === "no-speech" &&
                    state.operatorTurnActive
                ) {
                    console.log(
                        "Simula AI | Pausa detectada."
                    );

                    return;
                }


                console.error(
                    "Simula AI | Erro no reconhecimento:",
                    error
                );


                /*
                 * Erros que realmente impedem
                 * continuar ouvindo.
                 */
                if (
                    error === "not-allowed" ||
                    error === "service-not-allowed" ||
                    error === "audio-capture" ||
                    error === "language-not-supported"
                ) {
                    state.operatorTurnActive =
                        false;

                    state.submitWhenRecognitionEnds =
                        false;

                    clearTimeout(
                        state.restartTimer
                    );

                    updateMicrophoneUI(
                        false
                    );

                    handleSpeechError(
                        error
                    );

                    return;
                }


                /*
                 * Para outros erros transitórios,
                 * deixamos o onend decidir se
                 * deve reiniciar.
                 */
                if (
                    error !== "network"
                ) {
                    handleSpeechError(
                        error
                    );
                }
            };


        // -----------------------------------------------------
        // MICROFONE ENCERROU
        // -----------------------------------------------------

        recognition.onend =
            function () {
                /*
                 * Se essa já não é a instância atual,
                 * não fazemos nada.
                 */
                if (
                    state.recognition !==
                    recognition
                ) {
                    return;
                }


                state.recognizing =
                    false;


                console.log(
                    "Simula AI | Reconhecimento finalizado."
                );


                /*
                 * O operador clicou para concluir.
                 */
                if (
                    state.submitWhenRecognitionEnds
                ) {
                    state.submitWhenRecognitionEnds =
                        false;


                    const completedText =
                        cleanTranscript(
                            state.accumulatedTranscript ||
                            state.currentTranscript
                        );


                    state.operatorTurnActive =
                        false;


                    updateMicrophoneUI(
                        false
                    );


                    if (completedText) {
                        handleFinalSpeech(
                            completedText
                        );
                    } else {
                        showMessage(
                            "Não identificamos nenhuma fala. Tente novamente."
                        );
                    }


                    return;
                }


                /*
                 * Se o turno já foi encerrado
                 * ou o cliente começou a falar,
                 * não reiniciamos.
                 */
                if (
                    !state.operatorTurnActive ||
                    state.speaking
                ) {
                    updateMicrophoneUI(
                        false
                    );

                    return;
                }


                /*
                 * =================================================
                 * CORREÇÃO PRINCIPAL
                 * =================================================
                 *
                 * O Chrome pode encerrar uma sessão
                 * de SpeechRecognition após uma pausa.
                 *
                 * NÃO reutilizamos a instância encerrada.
                 *
                 * Criamos uma NOVA instância mantendo
                 * state.accumulatedTranscript.
                 */
                clearTimeout(
                    state.restartTimer
                );


                updateMicrophoneUI(
                    true
                );


                state.restartTimer =
                    setTimeout(
                        function () {
                            if (
                                !state.operatorTurnActive ||
                                state.speaking ||
                                state.recognizing
                            ) {
                                return;
                            }


                            console.log(
                                "Simula AI | Retomando reconhecimento após pausa."
                            );


                            const initialized =
                                initializeRecognition();


                            if (!initialized) {
                                state.operatorTurnActive =
                                    false;

                                updateMicrophoneUI(
                                    false
                                );

                                return;
                            }


                            try {
                                state.recognition.start();
                            } catch (error) {
                                console.warn(
                                    "Simula AI | Aguardando para retomar o microfone.",
                                    error
                                );


                                /*
                                 * Uma falha ao chamar start()
                                 * não apaga o texto já capturado.
                                 */
                                state.restartTimer =
                                    setTimeout(
                                        function () {
                                            if (
                                                !state.operatorTurnActive ||
                                                state.speaking ||
                                                state.recognizing
                                            ) {
                                                return;
                                            }

                                            try {
                                                initializeRecognition();

                                                state.recognition.start();
                                            } catch (retryError) {
                                                console.error(
                                                    "Simula AI | Não foi possível retomar o microfone:",
                                                    retryError
                                                );

                                                state.operatorTurnActive =
                                                    false;

                                                updateMicrophoneUI(
                                                    false
                                                );
                                            }
                                        },
                                        500
                                    );
                            }
                        },
                        300
                    );
            };


        return true;
    }


    // =========================================================
    // INICIAR TURNO DO OPERADOR
    // =========================================================

    function startListening() {
        if (!state.supported) {
            showMessage(
                "Seu navegador não suporta reconhecimento de voz. Use o Google Chrome."
            );

            return false;
        }


        /*
         * Não escutamos enquanto o cliente fala.
         */
        if (state.speaking) {
            showMessage(
                "Aguarde o cliente terminar de falar."
            );

            return false;
        }


        /*
         * O turno já está aberto.
         */
        if (
            state.operatorTurnActive ||
            state.recognizing
        ) {
            return true;
        }


        clearTimeout(
            state.restartTimer
        );


        /*
         * NOVO TURNO.
         */
        state.operatorTurnActive =
            true;

        state.submitWhenRecognitionEnds =
            false;

        state.accumulatedTranscript =
            "";

        state.finalTranscript =
            "";

        state.interimTranscript =
            "";

        state.currentTranscript =
            "";


        updateTranscriptDisplay();

        updateMicrophoneUI(
            true
        );


        /*
         * Começamos cada turno com uma
         * instância nova.
         */
        const initialized =
            initializeRecognition();


        if (!initialized) {
            state.operatorTurnActive =
                false;

            updateMicrophoneUI(
                false
            );

            return false;
        }


        try {
            state.recognition.start();

            return true;
        } catch (error) {
            state.operatorTurnActive =
                false;

            updateMicrophoneUI(
                false
            );


            console.error(
                "Simula AI | Não foi possível iniciar o microfone:",
                error
            );


            return false;
        }
    }


    // =========================================================
    // PARAR / CONCLUIR TURNO
    // =========================================================

    function stopListening(options = {}) {
        const submit =
            options.submit === true;


        clearTimeout(
            state.restartTimer
        );


        /*
         * O operador clicou para concluir.
         */
        if (submit) {
            state.submitWhenRecognitionEnds =
                true;

            /*
             * Não desligamos operatorTurnActive aqui.
             *
             * O onend fará isso depois de receber
             * o último resultado disponível.
             */
        } else {
            state.operatorTurnActive =
                false;

            state.submitWhenRecognitionEnds =
                false;
        }


        /*
         * O reconhecimento já pode ter encerrado
         * durante uma pausa.
         */
        if (
            !state.recognition ||
            !state.recognizing
        ) {
            if (submit) {
                const completedText =
                    cleanTranscript(
                        state.accumulatedTranscript ||
                        state.currentTranscript
                    );


                state.submitWhenRecognitionEnds =
                    false;

                state.operatorTurnActive =
                    false;


                updateMicrophoneUI(
                    false
                );


                if (completedText) {
                    handleFinalSpeech(
                        completedText
                    );
                } else {
                    showMessage(
                        "Não identificamos nenhuma fala. Tente novamente."
                    );
                }
            } else {
                updateMicrophoneUI(
                    false
                );
            }


            return;
        }


        try {
            /*
             * stop(), e não abort(),
             * para permitir o último resultado.
             */
            state.recognition.stop();
        } catch (error) {
            console.warn(
                "Simula AI | Erro ao parar reconhecimento:",
                error
            );


            if (submit) {
                const completedText =
                    cleanTranscript(
                        state.accumulatedTranscript ||
                        state.currentTranscript
                    );


                state.submitWhenRecognitionEnds =
                    false;

                state.operatorTurnActive =
                    false;


                updateMicrophoneUI(
                    false
                );


                if (completedText) {
                    handleFinalSpeech(
                        completedText
                    );
                } else {
                    showMessage(
                        "Não identificamos nenhuma fala. Tente novamente."
                    );
                }
            }
        }
    }


    // =========================================================
    // BOTÃO DO MICROFONE
    // =========================================================

    function toggleListening() {
        /*
         * Cliente está falando.
         */
        if (state.speaking) {
            showMessage(
                "Aguarde o cliente terminar de falar."
            );

            return;
        }


        /*
         * SEGUNDO CLIQUE:
         * conclui e envia.
         */
        if (state.operatorTurnActive) {
            stopListening({
                submit: true
            });

            return;
        }


        /*
         * PRIMEIRO CLIQUE:
         * abre o turno.
         */
        startListening();
    }


    // =========================================================
    // ENVIAR FALA COMPLETA PARA SIMULATION.JS
    // =========================================================

    function handleFinalSpeech(text) {
        const cleanText =
            cleanTranscript(
                text
            );


        if (!cleanText) {
            return;
        }


        /*
         * Mantemos a transcrição disponível
         * até o próximo turno.
         */
        state.currentTranscript =
            cleanText;

        state.finalTranscript =
            cleanText;


        updateTranscriptDisplay();


        console.log(
            "Simula AI | Operador disse:",
            cleanText
        );


        /*
         * SOMENTE AQUI enviamos a fala.
         *
         * O simulation.js já escuta este evento.
         */
        document.dispatchEvent(
            new CustomEvent(
                "simulaAI:speech",
                {
                    detail: {
                        text: cleanText
                    }
                }
            )
        );
    }


    // =========================================================
    // TRANSCRIÇÃO NA TELA
    // =========================================================

    function updateTranscriptDisplay() {
        const elements = [
            getElement(
                "speechTranscript"
            ),

            getElement(
                "liveTranscript"
            ),

            getElement(
                "operatorSpeech"
            ),

            getElement(
                "currentTranscript"
            )
        ];


        const text =
            state.currentTranscript;


        elements.forEach(
            function (element) {
                if (element) {
                    element.textContent =
                        text;
                }
            }
        );
    }


    // =========================================================
    // MICROFONE — INTERFACE
    // =========================================================

    function updateMicrophoneUI(active) {
        const buttons =
            document.querySelectorAll(
                "#microphoneButton, " +
                "#micButton, " +
                "[data-action='microphone'], " +
                "[data-action='toggle-microphone']"
            );


        buttons.forEach(
            function (button) {
                button.classList.toggle(
                    "recording",
                    active
                );


                button.classList.toggle(
                    "active",
                    active
                );


                button.setAttribute(
                    "aria-pressed",
                    active
                        ? "true"
                        : "false"
                );


                const icon =
                    button.querySelector(
                        "i"
                    );


                if (icon) {
                    icon.classList.remove(
                        "bi-mic",
                        "bi-mic-fill",
                        "bi-stop-fill"
                    );


                    icon.classList.add(
                        active
                            ? "bi-stop-fill"
                            : "bi-mic-fill"
                    );
                }
            }
        );


        const microphoneStatus =
            getElement(
                "microphoneStatus"
            );


        if (microphoneStatus) {
            microphoneStatus.textContent =
                active
                    ? "Ouvindo... clique novamente para concluir"
                    : "Clique para falar";
        }


        const voiceStatus =
            getElement(
                "voiceStatus"
            );


        if (
            voiceStatus &&
            !state.speaking
        ) {
            voiceStatus.textContent =
                active
                    ? "Ouvindo... clique novamente para concluir"
                    : "Clique para falar";
        }
    }


    // =========================================================
    // CARREGAR VOZES
    // =========================================================

    function loadVoices() {
        if (
            !state.synthesisSupported
        ) {
            return;
        }


        state.voices =
            window.speechSynthesis
                .getVoices();


        selectPortugueseVoice(
            "female"
        );
    }


    // =========================================================
    // SELECIONAR VOZ
    // =========================================================

    function selectPortugueseVoice(
        gender = "female"
    ) {
        if (!state.voices.length) {
            state.voices =
                window.speechSynthesis
                    .getVoices();
        }


        if (!state.voices.length) {
            return null;
        }


        const brazilianVoices =
            state.voices.filter(
                function (voice) {
                    return String(
                        voice.lang || ""
                    )
                        .toLowerCase()
                        .includes(
                            "pt-br"
                        );
                }
            );


        // -----------------------------------------------------
        // FEMININA — MARIA
        // -----------------------------------------------------

        if (gender === "female") {
            const maria =
                brazilianVoices.find(
                    function (voice) {
                        return String(
                            voice.name || ""
                        )
                            .toLowerCase()
                            .includes(
                                "maria"
                            );
                    }
                );


            if (maria) {
                state.selectedVoice =
                    maria;

                return maria;
            }
        }


        // -----------------------------------------------------
        // MASCULINA — DANIEL
        // -----------------------------------------------------

        if (gender === "male") {
            const daniel =
                brazilianVoices.find(
                    function (voice) {
                        return String(
                            voice.name || ""
                        )
                            .toLowerCase()
                            .includes(
                                "daniel"
                            );
                    }
                );


            if (daniel) {
                state.selectedVoice =
                    daniel;

                return daniel;
            }
        }


        // -----------------------------------------------------
        // GOOGLE PT-BR
        // -----------------------------------------------------

        const googleBrazil =
            brazilianVoices.find(
                function (voice) {
                    return String(
                        voice.name || ""
                    )
                        .toLowerCase()
                        .includes(
                            "google"
                        );
                }
            );


        if (googleBrazil) {
            state.selectedVoice =
                googleBrazil;

            return googleBrazil;
        }


        // -----------------------------------------------------
        // QUALQUER PT-BR
        // -----------------------------------------------------

        if (brazilianVoices.length) {
            state.selectedVoice =
                brazilianVoices[0];

            return state.selectedVoice;
        }


        // -----------------------------------------------------
        // QUALQUER PORTUGUÊS
        // -----------------------------------------------------

        const portuguese =
            state.voices.find(
                function (voice) {
                    return String(
                        voice.lang || ""
                    )
                        .toLowerCase()
                        .startsWith(
                            "pt"
                        );
                }
            );


        if (portuguese) {
            state.selectedVoice =
                portuguese;

            return portuguese;
        }


        state.selectedVoice =
            state.voices[0] ||
            null;


        return state.selectedVoice;
    }


    // =========================================================
    // IDENTIFICAR SEXO DA VOZ DO PERSONAGEM
    // =========================================================

    function getCustomerVoiceGender(
    options = {}
) {
    const femaleCustomers = [
        "fernanda",
        "fernanda costa",
        "renata",
        "renata oliveira",
        "mariana",
        "juliana",
        "patrícia",
        "patricia",
        "camila"
    ];


    const maleCustomers = [
        "carlos",
        "carlos silva",
        "roberto",
        "roberto almeida",
        "rafael",
        "andré",
        "andre",
        "lucas",
        "bruno"
    ];


    const customerName =
        String(
            options.customerName ||
            getElement(
                "conversationCustomerName"
            )?.textContent ||
            getElement(
                "customerName"
            )?.textContent ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        maleCustomers.some(
            function (name) {
                return customerName
                    .includes(name);
            }
        )
    ) {
        return "male";
    }


    if (
        femaleCustomers.some(
            function (name) {
                return customerName
                    .includes(name);
            }
        )
    ) {
        return "female";
    }


    return "female";
}

    // =========================================================
    // CLIENTE FALA
    // =========================================================

    function speak(
        text,
        options = {}
    ) {
        const cleanText =
            cleanTranscript(
                text
            );


        if (!cleanText) {
            return false;
        }


        if (
            !state.synthesisSupported
        ) {
            console.warn(
                "Simula AI | Síntese de voz não suportada."
            );

            return false;
        }


        try {
            /*
             * PROTEÇÃO CONTRA ECO.
             *
             * Antes de Maria/Daniel falar,
             * fechamos o microfone do operador.
             */
            if (
                state.recognizing ||
                state.operatorTurnActive
            ) {
                state.operatorTurnActive =
                    false;

                state.submitWhenRecognitionEnds =
                    false;


                clearTimeout(
                    state.restartTimer
                );


                stopListening({
                    submit: false
                });
            }


            window.speechSynthesis.cancel();


            const utterance =
                new SpeechSynthesisUtterance(
                    cleanText
                );


            utterance.lang =
                options.lang ||
                "pt-BR";


            const voiceGender =
                getCustomerVoiceGender(
                    options
                );


            const characterVoice =
                selectPortugueseVoice(
                    voiceGender
                );


            if (characterVoice) {
                utterance.voice =
                    characterVoice;
            }


            utterance.rate =
    Number.isFinite(
        options.rate
    )
        ? options.rate
        : 1.20;


            utterance.pitch =
                Number.isFinite(
                    options.pitch
                )
                    ? options.pitch
                    : (
                        voiceGender === "female"
                            ? 1.02
                            : 0.96
                    );


            utterance.volume =
                Number.isFinite(
                    options.volume
                )
                    ? options.volume
                    : 1;


            // -------------------------------------------------
            // CLIENTE COMEÇOU A FALAR
            // -------------------------------------------------

            utterance.onstart =
                function () {
                    state.speaking =
                        true;


                    updateSpeakingUI(
                        true
                    );


                    document.dispatchEvent(
                        new CustomEvent(
                            "simulaAI:speechStart",
                            {
                                detail: {
                                    text:
                                        cleanText
                                }
                            }
                        )
                    );
                };


            // -------------------------------------------------
            // CLIENTE TERMINOU
            // -------------------------------------------------

            utterance.onend =
                function () {
                    state.speaking =
                        false;


                    updateSpeakingUI(
                        false
                    );


                    document.dispatchEvent(
                        new CustomEvent(
                            "simulaAI:speechEnd",
                            {
                                detail: {
                                    text:
                                        cleanText
                                }
                            }
                        )
                    );


                    /*
                     * NÃO abrimos o microfone
                     * automaticamente.
                     */
                };


            // -------------------------------------------------
            // ERRO DA VOZ
            // -------------------------------------------------

            utterance.onerror =
                function (event) {
                    state.speaking =
                        false;


                    updateSpeakingUI(
                        false
                    );


                    if (
                        event &&
                        event.error === "canceled"
                    ) {
                        return;
                    }


                    console.error(
                        "Simula AI | Erro na síntese:",
                        event
                    );
                };


            window.speechSynthesis.speak(
                utterance
            );


            return true;

        } catch (error) {
            state.speaking =
                false;


            updateSpeakingUI(
                false
            );


            console.error(
                "Simula AI | Erro ao reproduzir voz:",
                error
            );


            return false;
        }
    }


    // =========================================================
    // INTERFACE — CLIENTE FALANDO
    // =========================================================

    function updateSpeakingUI(
        speaking
    ) {
        const status =
            getElement(
                "voiceStatus"
            );


        if (status) {
            status.textContent =
                speaking
                    ? "Cliente falando..."
                    : "Clique para falar";
        }


        const microphoneButton =
            getElement(
                "microphoneButton"
            );


        if (microphoneButton) {
            microphoneButton.disabled =
                Boolean(
                    speaking
                );


            microphoneButton.setAttribute(
                "aria-disabled",
                speaking
                    ? "true"
                    : "false"
            );
        }
    }


    // =========================================================
    // PARAR VOZ DO CLIENTE
    // =========================================================

    function stopSpeaking() {
        if (
            !state.synthesisSupported
        ) {
            return;
        }


        window.speechSynthesis.cancel();


        state.speaking =
            false;


        updateSpeakingUI(
            false
        );
    }


    // =========================================================
    // PAUSAR VOZ
    // =========================================================

    function pauseSpeaking() {
        if (
            !state.synthesisSupported
        ) {
            return;
        }


        window.speechSynthesis.pause();
    }


    // =========================================================
    // RETOMAR VOZ
    // =========================================================

    function resumeSpeaking() {
        if (
            !state.synthesisSupported
        ) {
            return;
        }


        window.speechSynthesis.resume();
    }


    // =========================================================
    // ERROS DO MICROFONE
    // =========================================================

    function handleSpeechError(
        error
    ) {
        const messages = {
            "not-allowed":
                "Permissão para usar o microfone foi negada.",

            "service-not-allowed":
                "O serviço de reconhecimento de voz não está disponível.",

            "no-speech":
                "Não identificamos nenhuma fala. Tente novamente.",

            "audio-capture":
                "Não foi possível acessar o microfone.",

            "network":
                "O reconhecimento de voz encontrou um problema de conexão.",

            "language-not-supported":
                "O idioma português não está disponível no reconhecimento."
        };


        const message =
            messages[error] ||
            "Ocorreu um problema com o reconhecimento de voz.";


        showMessage(
            message
        );
    }


    // =========================================================
    // MENSAGENS
    // =========================================================

    function showMessage(
        message
    ) {
        if (
            window.SimulaAI &&
            typeof window.SimulaAI
                .showToast ===
            "function"
        ) {
            window.SimulaAI.showToast(
                message,
                "warning"
            );

            return;
        }


        console.warn(
            "Simula AI |",
            message
        );
    }


    // =========================================================
    // BOTÕES
    // =========================================================

    function bindMicrophoneButtons() {
        const buttons =
            document.querySelectorAll(
                "#microphoneButton, " +
                "#micButton, " +
                "[data-action='microphone'], " +
                "[data-action='toggle-microphone']"
            );


        buttons.forEach(
            function (button) {
                if (
                    button.dataset
                        .speechBound ===
                    "true"
                ) {
                    return;
                }


                button.dataset
                    .speechBound =
                    "true";


                button.addEventListener(
                    "click",
                    function (event) {
                        event.preventDefault();

                        toggleListening();
                    }
                );
            }
        );
    }


    // =========================================================
    // API PÚBLICA
    // =========================================================

    window.SimulaAI.speech = {
        state,

        checkSupport,

        initializeRecognition,

        startListening,

        stopListening,

        toggleListening,

        speak,

        stopSpeaking,

        pauseSpeaking,

        resumeSpeaking,

        loadVoices,

        selectPortugueseVoice,

        getTranscript:
            function () {
                return state.currentTranscript;
            },

        isListening:
            function () {
                return (
                    state.recognizing ||
                    state.operatorTurnActive
                );
            },

        isSpeaking:
            function () {
                return state.speaking;
            }
    };


    // =========================================================
    // ATALHOS GLOBAIS
    // =========================================================

    window.SimulaAI.startListening =
        startListening;


    window.SimulaAI.stopListening =
        stopListening;


    window.SimulaAI.toggleListening =
        toggleListening;


    window.SimulaAI.speak =
        speak;


    window.SimulaAI.stopSpeaking =
        stopSpeaking;


    // =========================================================
    // INICIALIZAÇÃO
    // =========================================================

    function initialize() {
        const support =
            checkSupport();


        console.log(
            "Simula AI | Speech.js inicializado.",
            support
        );


        if (
            state.supported
        ) {
            /*
             * Só preparamos a instância.
             * O navegador NÃO começa a ouvir aqui.
             */
            initializeRecognition();
        }


        if (
            state.synthesisSupported
        ) {
            loadVoices();


            window.speechSynthesis
                .addEventListener(
                    "voiceschanged",
                    loadVoices
                );
        }


        bindMicrophoneButtons();
    }


    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );
    } else {
        initialize();
    }

})();