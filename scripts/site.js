let staticImageSuffix = 'static.png';
let animatedImageSuffix = 'animated.gif';
let staticImages = Array.from(document.querySelectorAll(`img[src$="${staticImageSuffix}"]`));
staticImages.forEach(function (staticImage) {
	let imageSource = staticImage.getAttribute('src');
	staticImage.addEventListener('mouseout', function deanimate() {
		event.target.setAttribute('src', imageSource.replace(animatedImageSuffix, staticImageSuffix));
	});
	staticImage.addEventListener('mouseover', function animate() {
		event.target.setAttribute('src', imageSource.replace(staticImageSuffix, animatedImageSuffix));
	});
});