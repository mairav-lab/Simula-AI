# 🎙️ Simula AI

**Simulador inteligente de atendimento para treinamento e desenvolvimento de operadores.**

O **Simula AI** é uma plataforma web desenvolvida para proporcionar experiências práticas de treinamento em atendimento ao cliente, permitindo que operadores participem de simulações realistas por voz com um cliente virtual conduzido por Inteligência Artificial.

A plataforma foi desenvolvida com foco em **Customer Experience, treinamento, desenvolvimento de competências e prática de atendimentos de retenção**.

---

## ✨ Sobre o projeto

Durante a simulação, o operador interage por voz com um cliente virtual que apresenta comportamentos e objeções de acordo com o cenário selecionado.

O objetivo é aproximar o treinamento da experiência de uma chamada real, estimulando competências como:

- Comunicação e acolhimento;
- Escuta ativa;
- Sondagem e identificação da causa raiz;
- Construção de argumentação;
- Tratativa de objeções;
- Retenção de clientes;
- Condução e fechamento do atendimento.

Ao final de cada simulação, o atendimento é analisado e o operador recebe uma avaliação estruturada de sua performance.

---

## 🚀 Principais funcionalidades

### 🎙️ Simulação por voz
Interação com o cliente virtual utilizando reconhecimento de voz e síntese de fala diretamente pelo navegador.

### 🤖 Cliente com Inteligência Artificial
O comportamento do cliente é conduzido por IA e varia conforme o cenário, contexto da conversa e nível de dificuldade.

### 🎯 Cenários de atendimento
Simulações estruturadas para diferentes situações encontradas em operações de retenção, incluindo problemas técnicos e concorrência.

### 📊 Avaliação automática
Ao finalizar o atendimento, a plataforma analisa a performance do operador em quatro pilares:

- **Abertura**
- **Sondagem**
- **Argumentação**
- **Checkout**

Cada simulação gera nota geral, análise por pilar, pontos positivos e oportunidades de melhoria.

### 📚 Histórico de simulações
Permite consultar atendimentos realizados anteriormente e visualizar novamente seus respectivos resultados.

### 👤 Painel do operador
Ambiente dedicado à seleção de cenários, realização das simulações e acompanhamento do desempenho.

### ⚙️ Painel administrativo
Área destinada à administração e acompanhamento da plataforma.

### 📖 Base de conhecimento
Área de consulta que apoia o acesso a conteúdos relevantes durante o uso da plataforma.

---

## 🧠 Fluxo da simulação

```text
Login
  ↓
Painel do Operador
  ↓
Seleção do cenário
  ↓
Preparação da simulação
  ↓
Atendimento por voz
  ↓
Finalização
  ↓
Avaliação automática
  ↓
Resultado e feedback
  ↓
Histórico
```

---

## 🛠️ Tecnologias utilizadas

### Front-end
- HTML5
- CSS3
- JavaScript
- Bootstrap Icons

### Inteligência Artificial
- Cloudflare Workers AI
- Llama 3.1

### Voz
- Web Speech API
- Speech Recognition
- Speech Synthesis

### Back-end e infraestrutura
- Cloudflare Workers
- Cloudflare D1

### Versionamento e publicação
- Git
- GitHub

---

## 📁 Estrutura do projeto

```text
Simula-AI/
│
├── assets/
│   ├── favicon.svg
│   ├── logo-concentrix.webp
│   └── logo-nio.jpg
│
├── css/
│   ├── style.css
│   └── responsive.css
│
├── data/
│   └── knowledge-base.json
│
├── js/
│   ├── admin.js
│   ├── app.js
│   ├── auth.js
│   ├── dashboard.js
│   ├── evaluation.js
│   ├── scenarios.js
│   ├── simulation.js
│   └── speech.js
│
├── index.html
└── README.md
```

---

## 🎯 Objetivo

O Simula AI foi desenvolvido como uma solução de aprendizagem prática, transformando conteúdos e procedimentos de atendimento em experiências interativas.

A proposta é permitir que o operador possa **praticar, errar, receber feedback e desenvolver suas habilidades** antes de aplicar esses conhecimentos em atendimentos reais.

---

## 💡 Diferenciais

O projeto integra em uma única experiência:

**Treinamento + Inteligência Artificial + Voz + Avaliação + Feedback + Histórico**

Em vez de utilizar apenas conteúdos teóricos, o Simula AI cria um ambiente de prática no qual cada atendimento pode gerar uma experiência diferente de acordo com a interação do operador.

---

## 🔐 Observação

Este projeto foi desenvolvido para fins de **treinamento e desenvolvimento profissional**.

Informações, processos e conteúdos utilizados nos cenários devem respeitar as políticas internas, regras de acesso e diretrizes aplicáveis ao ambiente em que a solução for utilizada.

---

## 👩‍💻 Desenvolvimento

**Maira Vanessa**  
Training Analyst II

Projeto desenvolvido com foco em inovação aplicada a **Treinamento & Desenvolvimento, Customer Experience e Inteligência Artificial**.

---

### Simula AI

> **Pratique. Desenvolva. Evolua.**