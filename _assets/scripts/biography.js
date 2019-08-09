const faxPaperStripClassName = 'fax-paper-strip';

let faxPaperStripHolesCount = 36;
let faxPaperStrips = Array.from(document.getElementsByClassName(faxPaperStripClassName));

function createFaxPaperStripHole() {
	let faxPaperStripHole = document.createElement('span');
	faxPaperStripHole.className = `${faxPaperStripClassName}-hole`;
	faxPaperStripHole.innerHTML = '&#11044;';
	return faxPaperStripHole;
}

function populateFaxPaperStrip(faxPaperStrip) {
	faxPaperStrip.innerHTML = '';
	for (let i = 1; i <= faxPaperStripHolesCount; i++) {
		let faxPaperStripHole = createFaxPaperStripHole();
		faxPaperStrip.appendChild(faxPaperStripHole);
	}
}

function populateFaxPaperStrips() {
	let contentHeight = document.getElementsByClassName('fax-paper-content')[0].scrollHeight;
	let computedStyle = window.getComputedStyle(document.getElementsByTagName('html')[0]);
	let fontSize = parseFloat(computedStyle.fontSize);
	let lineHeightMultiplier = parseFloat(computedStyle.lineHeight) / fontSize;
	faxPaperStripHolesCount = Math.round(contentHeight / fontSize / lineHeightMultiplier);
	faxPaperStrips.forEach(fps => populateFaxPaperStrip(fps));
}

Array.from(document.querySelectorAll('li[data-order]')).forEach(listItem => {
	listItem.style.order = listItem.dataset.order;
});

window.addEventListener('load', populateFaxPaperStrips);
window.addEventListener('resize', populateFaxPaperStrips);