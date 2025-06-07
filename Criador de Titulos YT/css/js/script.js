// Todo o código JavaScript que estava na tag <script> do seu HTML original
const titleForm = document.getElementById('titleForm');
const generateButton = document.getElementById('generateButton');
// ... todas as suas constantes de elementos ...

// ... todas as suas funções: titleForm.addEventListener, displayTitles, handleIndividualTitleRefinement, etc. ...

function displayError(message, element) {
    element.textContent = message;
    element.classList.remove('hidden');
}
