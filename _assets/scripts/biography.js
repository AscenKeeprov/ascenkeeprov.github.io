Array.from(document.querySelectorAll('li[data-order]')).forEach(listItem => {
	listItem.style.order = listItem.dataset.order;
});