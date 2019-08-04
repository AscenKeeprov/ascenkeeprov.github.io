const punchCardClassName = 'punch-card';
const punchCardMaxRowSlots = 37;
const punchCardRowClassName = 'punch-card-row';
const punchStyle = 'class="punch-hole"';
const punchTag = 'mark';

function createPunchCardRow() {
	let punchCardRow = document.createElement('div');
	punchCardRow.className = `${punchCardRowClassName}`;
	return punchCardRow;
}

function populatePunchCardRow(row, rowIndex, rowSlots) {
	let htmlContent = '';
	for (let rowSlot = 1; rowSlot <= rowSlots; rowSlot++) {
		let punchSlots = [2, 5, 10, 14, 16, 22, 25]
			.map(ps => ps * (rowIndex + 1) % rowSlots);
		if (punchSlots.includes(rowSlot)) {
			let punchHole = document.createElement(punchTag);
			punchHole.setAttribute(punchStyle.split('=')[0], punchStyle.split('=')[1].replace(/"/g, ''));
			punchHole.textContent = `${rowIndex}`;
			htmlContent += punchHole.outerHTML;
		} else htmlContent += `${rowIndex}`;
	}
	row.innerHTML = htmlContent;
}

function populatePunchCardRows(card, rowIndexStart, rowIndexEnd, rowSlots) {
	for (let rowIndex = rowIndexStart; rowIndex <= rowIndexEnd; rowIndex++) {
		let punchCardRow = createPunchCardRow();
		populatePunchCardRow(punchCardRow, rowIndex, rowSlots);
		card.appendChild(punchCardRow);
	}
}

let punchCards = Array.from(document.querySelectorAll(`.${punchCardClassName}`));
punchCards.forEach((punchCard) => {
	let punchCardRows = Array.from(punchCard.children)
		.filter(child => child.className.includes(`${punchCardRowClassName}`));
	if (punchCardRows.length == 0) {
		punchCard.innerHTML == '';
		populatePunchCardRows(punchCard, 0, 9, punchCardMaxRowSlots);
	}
	else {
		Array.from(punchCard.children)
			.filter(child => !child.className.includes(`${punchCardRowClassName}`))
			.forEach(oddChild => punchCard.removeChild(oddChild));
		for (let rowIndex = 0; rowIndex <= 9; rowIndex++) {
			if (rowIndex < punchCardRows.length) {
				let punchCardRow = punchCardRows[rowIndex];
				if (punchCardRow.innerHTML == '') populatePunchCardRow(punchCardRow, rowIndex, punchCardMaxRowSlots);
				else {
					let rowIcons = punchCardRow.querySelectorAll('.icon');
					let rowTextContent = punchCardRow.textContent.trim();
					let rowFreeSlots = punchCardMaxRowSlots - rowTextContent.length - rowIcons.length;
					let rowFiller = document.createElement('span');
					populatePunchCardRow(rowFiller, rowIndex, rowFreeSlots);
					if (rowIndex % 2 !== 0) punchCardRow.innerHTML = `${punchCardRow.innerHTML}${rowFiller.outerHTML}`;
					else punchCardRow.innerHTML = `${rowFiller.outerHTML}${punchCardRow.innerHTML}`;
				}
			} else {
				let punchCardRow = createPunchCardRow();
				populatePunchCardRow(punchCardRow, rowIndex, punchCardMaxRowSlots);
				punchCard.appendChild(punchCardRow);
			}
		}
	}
});