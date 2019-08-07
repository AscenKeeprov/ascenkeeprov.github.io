let currentYear = new Date().getFullYear();
let currentYearElement = document.getElementById('currentYear');
if (!currentYearElement.innerText.includes(currentYear)) {
	currentYearElement.innerText = currentYear;
}