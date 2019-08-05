const punchCardClassName = 'punch-card';
const punchCardRowClassName = 'punch-card-row';
const punchCardRowsCount = 10;
const punchCardRowSlotsCount = 38;
const punchHoleStyleAttribute = 'class="punch-hole"';
const punchHoleTagName = 'mark';

function createPunchCardRow() {
	let punchCardRow = document.createElement('div');
	punchCardRow.className = `${punchCardRowClassName}`;
	return punchCardRow;
}

function populatePunchCardRow(row, rowIndex) {
	let htmlContent = '';
	if (rowIndex < punchCardRowsCount) {
		for (let rowSlot = 1; rowSlot <= punchCardRowSlotsCount; rowSlot++) {
			let punchSlots = [2, 5, 10, 14, 16, 22, 25, 31, 34]
				.map(ps => ps * (rowIndex + 1) % punchCardRowSlotsCount);
			if (punchSlots.includes(rowSlot)) {
				let punchHole = document.createElement(punchHoleTagName);
				punchHole.setAttribute(punchHoleStyleAttribute.split('=')[0],
					punchHoleStyleAttribute.split('=')[1].replace(/"/g, ''));
				punchHole.textContent = `${rowIndex}`;
				htmlContent += punchHole.outerHTML;
			} else htmlContent += `${rowIndex}`;
		}
	} else if (rowIndex == punchCardRowsCount) {
		for (let rowSlot = 1; rowSlot <= punchCardRowSlotsCount * 2; rowSlot++) {
			htmlContent += `${rowSlot} `;
		}
	}
	row.innerHTML = htmlContent;
}

function populatePunchCardRows(card, rowIndexStart, rowIndexEnd) {
	for (let rowIndex = rowIndexStart; rowIndex <= rowIndexEnd; rowIndex++) {
		let punchCardRow = createPunchCardRow();
		populatePunchCardRow(punchCardRow, rowIndex);
		card.appendChild(punchCardRow);
	}
}

let punchCards = Array.from(document.querySelectorAll(`.${punchCardClassName}`));
punchCards.forEach((punchCard) => {
	let punchCardRows = Array.from(punchCard.children)
		.filter(child => child.className.includes(`${punchCardRowClassName}`));
	if (punchCardRows.length == 0) {
		punchCard.innerHTML == '';
		populatePunchCardRows(punchCard, 0, punchCardRowsCount);
	}
	else {
		Array.from(punchCard.children)
			.filter(child => !child.className.includes(`${punchCardRowClassName}`))
			.forEach(oddChild => punchCard.removeChild(oddChild));
		for (let rowIndex = 0; rowIndex <= punchCardRowsCount; rowIndex++) {
			if (rowIndex < punchCardRows.length) {
				let punchCardRow = punchCardRows[rowIndex];
				if (punchCardRow.innerHTML == '') populatePunchCardRow(punchCardRow, rowIndex);
				else {
					let rowFiller = document.createElement('span');
					populatePunchCardRow(rowFiller, rowIndex);
					if (rowIndex % 2 !== 0) punchCardRow.innerHTML = `${punchCardRow.innerHTML}${rowFiller.outerHTML}`;
					else punchCardRow.innerHTML = `${rowFiller.outerHTML}${punchCardRow.innerHTML}`;
				}
			} else {
				let punchCardRow = createPunchCardRow();
				populatePunchCardRow(punchCardRow, rowIndex);
				punchCard.appendChild(punchCardRow);
			}
		}
	}
});