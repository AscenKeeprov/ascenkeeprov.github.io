const faxPaperStripClassName = 'fax-paper-strip';

let faxPaperStripHolesCount = 23;
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
	if (faxPaperStrips.length) {
		let content = Array.from(document.getElementsByClassName('fax-paper-content')[0].children);
		let contentHeight = content.map(c => c.scrollHeight).reduce((c1, c2) => c1 + c2, 0);
		let faxPaperStripHoleGap = parseFloat(window.getComputedStyle(faxPaperStrips[0]).rowGap);
		let faxPaperStripHoleSize = parseFloat(window.getComputedStyle(faxPaperStrips[0]
			.querySelector(`.${faxPaperStripClassName}-hole`)).height);
		faxPaperStripHolesCount = Math.ceil(contentHeight / (faxPaperStripHoleSize + faxPaperStripHoleGap));
		faxPaperStrips.forEach(fps => populateFaxPaperStrip(fps));
	}
}

Array.from(document.querySelectorAll('li[data-order]')).forEach(listItem => {
	listItem.style.order = listItem.dataset.order;
});

Array.from(document.getElementsByTagName('details')).forEach(d => {
	d.addEventListener('toggle', populateFaxPaperStrips);
});

window.addEventListener('load', populateFaxPaperStrips);
window.addEventListener('resize', populateFaxPaperStrips);