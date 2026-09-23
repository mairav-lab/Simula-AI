/**
 * ============================================================
 * SIMULA AI
 * AUTH.JS
 * Controle de sessão e perfis de acesso
 * ============================================================
 *
 * PERFIS:
 * - operador
 * - admin
 *
 * OBSERVAÇÃO:
 * Nesta primeira versão o controle é local, apenas para
 * desenvolvimento e testes.
 *
 * A autenticação definitiva e a autorização administrativa
 * serão integradas ao Supabase posteriormente.
 * ============================================================
 */

(function () {
    "use strict";

    /* =========================================================
       CONFIGURAÇÕES
    ========================================================= */

    const STORAGE_KEY = "simulaAI_user";

    /*
     * ADMINISTRADORES AUTORIZADOS PARA TESTE
     *
     * Enquanto ainda não temos Supabase, estes e-mails
     * serão reconhecidos como administradores.
     *
     * Depois esta lista será substituída pelo controle
     * real de permissões no banco.
     */

    const ADMIN_EMAILS = [
        "maira.pinto@concentrix.com"
    ];


    /* =========================================================
       ESTADO
    ========================================================= */

    let currentUser = null;


    /* =========================================================
       UTILITÁRIOS
    ========================================================= */

    function normalizeEmail(email) {
        return String(email || "")
            .trim()
            .toLowerCase();
    }


    function normalizeName(name) {
        return String(name || "")
            .trim()
            .replace(/\s+/g, " ");
    }


    function getInitials(name) {

        const normalizedName = normalizeName(name);

        if (!normalizedName) {
            return "U";
        }

        const parts = normalizedName.split(" ");

        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }

        return (
            parts[0].charAt(0) +
            parts[parts.length - 1].charAt(0)
        ).toUpperCase();
    }


    /* =========================================================
       DEFINIÇÃO DO PERFIL
    ========================================================= */

    function determineRole(email) {

        const normalizedEmail = normalizeEmail(email);

        if (ADMIN_EMAILS.includes(normalizedEmail)) {
            return "admin";
        }

        return "operador";
    }


    /* =========================================================
       CRIAR USUÁRIO
    ========================================================= */

    function createUser(name, email) {

        const normalizedName = normalizeName(name);
        const normalizedEmail = normalizeEmail(email);

        if (!normalizedName) {
            throw new Error("Informe seu nome.");
        }

        if (!normalizedEmail) {
            throw new Error("Informe seu e-mail.");
        }

        const role = determineRole(normalizedEmail);

        return {
            id: generateUserId(),
            name: normalizedName,
            email: normalizedEmail,
            role: role,
            initials: getInitials(normalizedName),
            loginAt: new Date().toISOString()
        };
    }


    /* =========================================================
       ID DO USUÁRIO
    ========================================================= */

    function generateUserId() {

        return (
            "user_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .substring(2, 8)
        );
    }


    /* =========================================================
       SALVAR SESSÃO
    ========================================================= */

    function saveSession(user) {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(user)
            );

        } catch (error) {

            console.error(
                "Erro ao salvar sessão:",
                error
            );

        }
    }


    /* =========================================================
       RECUPERAR SESSÃO
    ========================================================= */

    function getStoredUser() {

        try {

            const storedUser =
                localStorage.getItem(STORAGE_KEY);

            if (!storedUser) {
                return null;
            }

            const parsedUser =
                JSON.parse(storedUser);

            if (
                !parsedUser ||
                !parsedUser.name ||
                !parsedUser.email ||
                !parsedUser.role
            ) {
                return null;
            }

            return parsedUser;

        } catch (error) {

            console.error(
                "Erro ao recuperar sessão:",
                error
            );

            return null;
        }
    }


    /* =========================================================
       LOGIN
    ========================================================= */

    function login(name, email) {

        try {

            const user =
                createUser(name, email);

            currentUser = user;

            saveSession(user);

            updateUserInterface();

            routeUser();

            return {
                success: true,
                user: user
            };

        } catch (error) {

            console.error(
                "Erro no login:",
                error
            );

            showAuthError(
                error.message ||
                "Não foi possível realizar o login."
            );

            return {
                success: false,
                error: error.message
            };
        }
    }


    /* =========================================================
       LOGOUT
    ========================================================= */

    function logout() {

        currentUser = null;

        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error(
                "Erro ao encerrar sessão:",
                error
            );
        }

        showScreen("loginScreen");

        hideElement("mainApp");

        hideElement("operatorPanel");

        hideElement("adminPanel");

        hideElement("simulationScreen");

        hideElement("resultScreen");

        clearLoginForm();
    }


    /* =========================================================
       INICIALIZAÇÃO DA SESSÃO
    ========================================================= */

    function initializeAuth() {

        const storedUser =
            getStoredUser();

        if (storedUser) {

            currentUser = storedUser;

            updateUserInterface();

            showElement("mainApp");

            routeUser();

            return;
        }

        showScreen("loginScreen");
    }


    /* =========================================================
       ROTEAMENTO
    ========================================================= */

    function routeUser() {

        if (!currentUser) {
            showScreen("loginScreen");
            return;
        }

        showElement("mainApp");

        hideElement("loginScreen");

        /*
         * Administrador
         */

        if (currentUser.role === "admin") {

            showAdminPanel();

            return;
        }


        /*
         * Operador
         */

        showOperatorPanel();
    }


    /* =========================================================
       PAINEL OPERADOR
    ========================================================= */

    function showOperatorPanel() {

        hideElement("adminPanel");

        hideElement("simulationScreen");

        hideElement("resultScreen");

        showElement("operatorPanel");

        updateUserInterface();

        /*
         * Permite que o dashboard.js atualize os dados
         * do operador quando esse arquivo estiver carregado.
         */

        if (
            window.SimulaAI &&
            typeof window.SimulaAI.loadOperatorDashboard === "function"
        ) {

            window.SimulaAI.loadOperatorDashboard();
        }
    }


    /* =========================================================
       PAINEL ADMIN
    ========================================================= */

    function showAdminPanel() {

        hideElement("operatorPanel");

        hideElement("simulationScreen");

        hideElement("resultScreen");

        showElement("adminPanel");

        updateUserInterface();

        /*
         * Permite que o admin.js carregue os dados
         * administrativos posteriormente.
         */

        if (
            window.SimulaAI &&
            typeof window.SimulaAI.loadAdminDashboard === "function"
        ) {

            window.SimulaAI.loadAdminDashboard();
        }
    }


    /* =========================================================
       VERIFICAÇÃO DE ADMIN
    ========================================================= */

    function isAdmin() {

        return (
            currentUser &&
            currentUser.role === "admin"
        );
    }


    /* =========================================================
       VERIFICAÇÃO DE OPERADOR
    ========================================================= */

    function isOperator() {

        return (
            currentUser &&
            currentUser.role === "operador"
        );
    }


    /* =========================================================
       USUÁRIO ATUAL
    ========================================================= */

    function getCurrentUser() {
        return currentUser;
    }


    /* =========================================================
       ATUALIZAR INTERFACE DO USUÁRIO
    ========================================================= */

    function updateUserInterface() {

        if (!currentUser) {
            return;
        }


        /*
         * Nome no header
         */

        setText(
            "headerUserName",
            currentUser.name
        );


        /*
         * Perfil no header
         */

        setText(
            "headerUserRole",
            getRoleLabel(currentUser.role)
        );


        /*
         * Avatar
         */

        setText(
            "headerUserAvatar",
            currentUser.initials
        );


        /*
         * Nome de boas-vindas do operador
         */

        setText(
            "operatorWelcomeName",
            getFirstName(currentUser.name)
        );
    }


    /* =========================================================
       LABEL DO PERFIL
    ========================================================= */

    function getRoleLabel(role) {

        if (role === "admin") {
            return "Administrador";
        }

        return "Operador";
    }


    /* =========================================================
       PRIMEIRO NOME
    ========================================================= */

    function getFirstName(name) {

        const normalizedName =
            normalizeName(name);

        if (!normalizedName) {
            return "Operador";
        }

        return normalizedName.split(" ")[0];
    }


    /* =========================================================
       CONTROLE DE ELEMENTOS
    ========================================================= */

    function showElement(id) {

        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        element.classList.remove("hidden");
    }


    function hideElement(id) {

        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        element.classList.add("hidden");
    }


    function showScreen(id) {

        const screens = [
            "loginScreen",
            "mainApp",
            "operatorPanel",
            "adminPanel",
            "simulationScreen",
            "resultScreen"
        ];

        screens.forEach(function (screenId) {

            if (screenId === id) {
                showElement(screenId);
            } else if (
                screenId !== "mainApp"
            ) {
                hideElement(screenId);
            }

        });
    }


    /* =========================================================
       TEXTO
    ========================================================= */

    function setText(id, value) {

        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        element.textContent =
            value !== undefined &&
            value !== null
                ? value
                : "";
    }


    /* =========================================================
       LIMPAR FORMULÁRIO
    ========================================================= */

    function clearLoginForm() {

        const nameInput =
            document.getElementById("userName");

        const emailInput =
            document.getElementById("userEmail");

        if (nameInput) {
            nameInput.value = "";
        }

        if (emailInput) {
            emailInput.value = "";
        }
    }


    /* =========================================================
       ERRO DE AUTENTICAÇÃO
    ========================================================= */

    function showAuthError(message) {

        /*
         * Primeiro tenta usar o sistema de toast do app.
         */

        if (
            window.SimulaAI &&
            typeof window.SimulaAI.showToast === "function"
        ) {

            window.SimulaAI.showToast(
                message,
                "error"
            );

            return;
        }


        /*
         * Fallback simples enquanto o app.js ainda
         * não estiver implementado.
         */

        alert(message);
    }


    /* =========================================================
       EVENTO DO FORMULÁRIO
    ========================================================= */

    function setupLoginForm() {

        const loginForm =
            document.getElementById("loginForm");

        if (!loginForm) {
            return;
        }

        loginForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                const nameInput =
                    document.getElementById("userName");

                const emailInput =
                    document.getElementById("userEmail");

                const name =
                    nameInput
                        ? nameInput.value
                        : "";

                const email =
                    emailInput
                        ? emailInput.value
                        : "";

                login(
                    name,
                    email
                );
            }
        );
    }


    /* =========================================================
       EVENTO LOGOUT
    ========================================================= */

    function setupLogout() {

        const logoutButton =
            document.getElementById("logoutButton");

        if (!logoutButton) {
            return;
        }

        logoutButton.addEventListener(
            "click",
            function () {

                logout();
            }
        );
    }


    /* =========================================================
       API PÚBLICA
    ========================================================= */

    window.SimulaAI =
        window.SimulaAI || {};

    window.SimulaAI.auth = {

        login: login,

        logout: logout,

        getCurrentUser:
            getCurrentUser,

        isAdmin:
            isAdmin,

        isOperator:
            isOperator,

        getRoleLabel:
            getRoleLabel,

        initialize:
            initializeAuth

    };


    /* =========================================================
       INICIALIZAÇÃO
    ========================================================= */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            setupLoginForm();

            setupLogout();

            initializeAuth();

        }
    );

})();