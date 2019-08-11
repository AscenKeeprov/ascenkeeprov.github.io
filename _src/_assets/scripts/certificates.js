function displayImageFullScreen() {
	let page = this.closest('.page-content');
	let siteHeaderHeight = parseFloat(window.getComputedStyle(
		document.getElementsByClassName('site-header')[0]
	).height);
	let overlay = document.createElement('div');
	overlay.className = 'overlay';
	overlay.style.height = `${document.body.scrollHeight}px`;
	overlay.style.backgroundImage = `url("${this.getAttribute('src')}")`;
	overlay.style.backgroundSize = `auto ${window.innerHeight}px`;
	overlay.style.top = `${siteHeaderHeight}px`;
	overlay.addEventListener('click', () => {
		event.target.remove();
	});
	page.appendChild(overlay);
}

Array.from(document.querySelectorAll('.image-frame img')).forEach(image => {
	image.addEventListener('click', displayImageFullScreen);
});