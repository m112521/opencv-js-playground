document.body.classList.add("loading");

const imgElement = document.querySelector('#imageOriginal');
const inputElement = document.querySelector('#imageInput');
const canvas = document.querySelector('#imageCanvas');

let canvasPos;
let mat;
let startX;
let startY;
let moveX;
let moveY;
let drawing = false;

let cnts;

let lastState;
let strJS = `let src = cv.imread('YOUR_CANVAS_ID');\nlet dst = new cv.Mat();\n`;
let strLastState;

inputElement.addEventListener('change', (e) => {
  imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);

imgElement.addEventListener('load', () => {
  mat = cv.imread(imgElement);
  cv.imshow('imageCanvas', mat);
  showCanvasBtns();
}, false);

canvas.addEventListener('mousedown', down);
canvas.addEventListener('mouseup', up);
canvas.addEventListener('mousemove', move);
canvas.addEventListener('mouseleave', up);

document.querySelector('#contours').addEventListener('click', () => {
	this.disabled = true;
	
	let src = cv.imread('imageCanvas'); 
	lastState = src.clone();
	strLastState = strJS;

    let dst = new cv.Mat();

	cnts = new cv.MatVector();
	let hierarchy = new cv.Mat();

	let mode = document.querySelector('#mode').value;

	cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
	//cv.Canny(src, dst, 30, 120, 3, false);

	cv.findContours(src, cnts, hierarchy, eval(mode), cv.CHAIN_APPROX_SIMPLE);
	cv.cvtColor(src, dst, cv.COLOR_GRAY2RGB, 0);

	document.querySelector('#cnts_count').innerText = `${ cnts.size() }`;

	for (let i = 0; i < cnts.size(); ++i) {
		let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255), Math.round(Math.random() * 255));
		cv.drawContours(dst, cnts, i, color, 1, cv.LINE_8, hierarchy, 0);
	}

	cv.imshow('imageCanvas', dst);
    src.delete();
	dst.delete();
	//contours.delete(); 
	hierarchy.delete(); 
    
	this.disabled = false;
	showBboxBtn();
}, false);

document.querySelector('#bbox_btn').addEventListener('click', (e) => {
	this.disabled = true;

	let src = cv.imread('imageCanvas'); 
	lastState = src.clone();
	strLastState = strJS;

	let centroid;

	let cntNum = parseInt(document.querySelector('#bbox').value);
	if (cntNum < cnts.size() && cntNum >= 0) {
		let cnt = cnts.get(cntNum);
		let rect = cv.boundingRect(cnt);
		let contoursColor = new cv.Scalar(0, 0, 255, 255);
		let rectangleColor = new cv.Scalar(0, 0, 255, 255);
	
		let point1 = new cv.Point(rect.x, rect.y);
		let point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
		cv.rectangle(src, point1, point2, rectangleColor, 2, cv.LINE_AA, 0);	
	
		let Moments = cv.moments(cnt, false);
		centroid = contourCentroid(Moments);
	
		cv.circle(src, centroid, 3, rectangleColor, 2, cv.LINE_AA, 0);
	
		document.querySelector('#cnts_count').innerText = `${ cnts.size() }`;
		document.querySelector('#cnt_area').innerText = `${ cv.contourArea(cnt, false) }`;
		document.querySelector('#cnt_centroid').innerText = `X: ${ centroid.x } | Y: ${ centroid.y }`;

		cnt.delete();
	}
	else {
		alert(`Wrong contour number!\nContour numbers start at 0`);
	}

	let ctx = document.getElementById('imageCanvas').getContext('2d');
  

	cv.imshow('imageCanvas', src);
    src.delete();
	
	ctx.font = "48px serif";
	//ctx.fillText(`${ centroid.x }; ${ centroid.y }`, 10, 50);

    this.disabled = false;
}, false);

document.querySelector('#in_range').addEventListener('click', (e) => {
	this.disabled = true;

	let src = cv.imread('imageCanvas'); 
	lastState = src.clone();
	strLastState = strJS;

	let dst = new cv.Mat();
	
	let start = hexToRgb(document.querySelector('#color_start').value);
	let end = hexToRgb(document.querySelector('#color_end').value);

	let low = new cv.Mat(src.rows, src.cols, src.type(), [parseInt(start.r), parseInt(start.g), parseInt(start.b), 0]);
	let high = new cv.Mat(src.rows, src.cols, src.type(), [parseInt(end.r), parseInt(end.g), parseInt(end.b), 255]);
	cv.inRange(src, low, high, dst);

	cv.imshow('imageCanvas', dst);
	src.delete();
	dst.delete();
	low.delete();
	high.delete();

	strJS += `cv.inRange(src, new cv.Mat(src.rows, src.cols, src.type(), [${parseInt(start.r)}, ${parseInt(start.g)}, ${parseInt(start.b)}, 0]), new cv.Mat(${src.rows}, ${src.cols}, ${src.type()}, ${[parseInt(end.r)]}, ${parseInt(end.g)}, ${parseInt(end.b)}, 255]), dst);\n`;

	this.disabled = false;
}, false);

document.querySelector('#thresh_btn').addEventListener('click', (e) => {
	this.disabled = true;

	let src = cv.imread('imageCanvas'); 
	lastState = src.clone();
	strLastState = strJS;

	let dst = new cv.Mat();

	let threshType = document.querySelector('#thresh_type').value;
	let thresh1 = parseInt(document.querySelector('#thresh1').value);
	let thresh2 = parseInt(document.querySelector('#thresh2').value);
	
	cv.threshold(src, dst, thresh1, thresh2, eval(threshType));

	cv.imshow('imageCanvas', dst);
	src.delete();
	dst.delete();

	strJS += `cv.threshold(src, dst, ${thresh1}, ${thresh2}, ${threshType});\n`;

	this.disabled = false;
}, false);

document.querySelector('#laplacian_btn').addEventListener('click', (e) => {
	this.disabled = true;

	let src = cv.imread('imageCanvas'); 
	lastState = src.clone();
	strLastState = strJS;

    let dst = new cv.Mat();

	let gmode = document.querySelector('#gmode').value;
	cv.cvtColor(src, src, cv.COLOR_RGB2GRAY, 0);

	if (gmode === 'dstx') {
		cv.Sobel(src, dst, cv.CV_8U, 1, 0, 3, 1, 0, cv.BORDER_DEFAULT);
		strJS += `cv.Sobel(src, dst, cv.CV_8U, 1, 0, 3, 1, 0, cv.BORDER_DEFAULT);\n`;
	}
	else if (gmode === 'dsty') {
		cv.Sobel(src, dst, cv.CV_8U, 0, 1, 3, 1, 0, cv.BORDER_DEFAULT);
		strJS += `cv.Sobel(src, dst, cv.CV_8U, 0, 1, 3, 1, 0, cv.BORDER_DEFAULT);\n`;
	}
	else {
		cv.Laplacian(src, dst, cv.CV_8U, 1, 1, 0, cv.BORDER_DEFAULT);
		strJS += `cv.Laplacian(src, dst, cv.CV_8U, 1, 1, 0, cv.BORDER_DEFAULT);\n`;
	}

	cv.imshow('imageCanvas', dst);
	src.delete();
	dst.delete();
	
	this.disabled = false;
}, false);

document.querySelector('#morph').addEventListener('click', (e) => {
	this.disabled = true;

	let src = cv.imread('imageCanvas'); 
	lastState = src.clone();
	strLastState = strJS;

	let dst = new cv.Mat();
	
	let alg = document.querySelector('#alg').value;
	let kernel = parseInt(document.querySelector('#morph_kernel').value);
	let iters = parseInt(document.querySelector('#morph_iters').value);

	let M = cv.Mat.ones(kernel, kernel, cv.CV_8U);
	let anchor = new cv.Point(-1, -1);

	if (alg === 'erosion') {
		cv.erode(src, dst, M, anchor, iters, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
		strJS += `cv.erode(src, dst, cv.Mat.ones(${kernel}, ${kernel}, cv.CV_8U), new cv.Point(-1, -1), ${iters}, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());\n`;
	}
	else if(alg === 'dilation') {
		cv.dilate(src, dst, M, anchor, iters, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
		strJS += `cv.erode(src, dst, cv.Mat.ones(${kernel}, ${kernel}, cv.CV_8U), new cv.Point(-1, -1), ${iters}, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());\n`;
	}
	else if(alg === 'opening') {
		cv.morphologyEx(src, dst, cv.MORPH_OPEN, M, anchor, iters, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
		strJS += `cv.morphologyEx(src, dst, cv.MORPH_OPEN, cv.Mat.ones(${kernel}, ${kernel}, cv.CV_8U), new cv.Point(-1, -1), ${iters}, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());\n`;
	}
	else {
		cv.morphologyEx(src, dst, cv.MORPH_CLOSE, M);
		strJS += `cv.morphologyEx(src, dst, cv.MORPH_CLOSE, cv.Mat.ones(${kernel}, ${kernel}, cv.CV_8U));\n`;
	}
	
	document.querySelector('#kernel_txt').innerText = `${ kernel }`;
	document.querySelector('#iters_txt').innerText = `${ iters }`;
	 
	cv.imshow('imageCanvas', dst);
	src.delete();
	dst.delete();

	this.disabled = false;
}, false);

document.querySelector('#hough').addEventListener('click', () => {
	this.disabled = true;

	let hough1 = parseInt(document.querySelector('#hough1').value);
	let hough2 = parseInt(document.querySelector('#hough2').value);
	let hough3 = parseInt(document.querySelector('#hough3').value);
	let hough4 = parseInt(document.querySelector('#hough4').value);
	let hough5 = parseInt(document.querySelector('#hough5').value);
	let hough6 = parseInt(document.querySelector('#hough6').value);

	let mat = cv.imread('imageCanvas');
	lastState = mat.clone();
	strLastState = strJS;

	let dst = mat.clone();
	let circles = new cv.Mat();
	cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY, 0);
	cv.HoughCircles(mat, circles, cv.HOUGH_GRADIENT, hough1, hough2, hough3, hough4, hough5, hough6);
	 
	for (let i = 0; i < circles.cols; ++i) {
    	let x = circles.data32F[i * 3];
    	let y = circles.data32F[i * 3 + 1];
    	let radius = circles.data32F[i * 3 + 2];
    	let center = new cv.Point(x, y);
    	cv.circle(dst, center, radius, [0, 0, 0, 255], 3);
	}
	
	cv.imshow('imageCanvas', dst);
	mat.delete();
	dst.delete();
	circles.delete();

	strJS += `let circles = new cv.Mat();\n`;
	strJS += `cv.HoughCircles(src, circles, cv.HOUGH_GRADIENT, ${hough1}, ${hough2}, ${hough3}, ${hough4}, ${hough5}, ${hough6});\n`;
	strJS += `for (let i = 0; i < circles.cols; ++i) {
		let x = circles.data32F[i * 3];
		let y = circles.data32F[i * 3 + 1];
		let radius = circles.data32F[i * 3 + 2];
		let center = new cv.Point(x, y);
		cv.circle(dst, center, radius, [0, 0, 0, 255], 3);
	}\n`;

	this.disabled = false;
}, false);

document.querySelector('#hough_line').addEventListener('click', () => {
	this.disabled = true;

	let hough1 = parseInt(document.querySelector('#hough1_line').value);
	let hough2 = parseInt(document.querySelector('#hough2_line').value);
	let hough3 = parseInt(document.querySelector('#hough3_line').value);
	let hough4 = parseInt(document.querySelector('#hough4_line').value);
	let hough5 = parseInt(document.querySelector('#hough5_line').value);
	let hough6 = parseInt(document.querySelector('#hough6_line').value);
	let hough7 = parseInt(document.querySelector('#hough7_line').value);

	if (hough7 > hough6) {
		let mat = cv.imread('imageCanvas');
		lastState = mat.clone();
		strLastState = strJS;

		let dst = mat.clone();
		let lines = new cv.Mat();
		cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY, 0);
		cv.Canny(mat, mat, 50, 200, 3);
		
		cv.HoughLines(mat, lines, hough1, hough2 * (Math.PI / 180), hough3, hough4, hough5, hough6 * (Math.PI / 180), hough7 * (Math.PI / 180));
	
		for (let i = 0; i < lines.rows; ++i) {
			let rho = lines.data32F[i * 2];
			let theta = lines.data32F[i * 2 + 1];
			let a = Math.cos(theta);
			let b = Math.sin(theta);
			let x0 = a * rho;
			let y0 = b * rho;
			let startPoint = {x: x0 - 1000 * b, y: y0 + 1000 * a};
			let endPoint = {x: x0 + 1000 * b, y: y0 - 1000 * a};
			cv.line(dst, startPoint, endPoint, [255, 0, 0, 255]);
		}
		
		cv.imshow('imageCanvas', dst);
		mat.delete();
		dst.delete();
		lines.delete();	

		strJS += `let lines = new cv.Mat();\n`;
		strJS += `cv.HoughLines(src, lines, ${hough1}, ${hough2 * (Math.PI / 180)}, ${hough3}, ${hough4}, ${hough5}, ${hough6 * (Math.PI / 180)}, ${hough7 * (Math.PI / 180)});\n`;
		strJS += `for (let i = 0; i < lines.rows; ++i) {
			let rho = lines.data32F[i * 2];
			let theta = lines.data32F[i * 2 + 1];
			let a = Math.cos(theta);
			let b = Math.sin(theta);
			let x0 = a * rho;
			let y0 = b * rho;
			let startPoint = {x: x0 - 1000 * b, y: y0 + 1000 * a};
			let endPoint = {x: x0 + 1000 * b, y: y0 - 1000 * a};
			cv.line(dst, startPoint, endPoint, [255, 0, 0, 255]);
		}\n`;

	}
	else {
		alert("Min theta must be less than Max theta!");
	}


	this.disabled = false;
}, false);

document.querySelector('#canny').addEventListener('click', (e) => {
	this.disabled = true;

	let canny1 = parseInt(document.querySelector('#canny1').value);
	let canny2 = parseInt(document.querySelector('#canny2').value);
	let canny3 = parseInt(document.querySelector('#canny3').value);

	let src = cv.imread('imageCanvas'); 
	lastState = src.clone();
	strLastState = strJS;

	let dst = new cv.Mat();

	cv.Canny(src, dst, canny1, canny2, canny3, false);
	
    cv.imshow('imageCanvas', dst);
    src.delete();
	dst.delete();
	
	strJS += `cv.Canny(src, dst, ${canny1}, ${canny2}, ${canny3}, false);`;

	this.disabled = false;
}, false);

document.querySelector('#button').addEventListener('click', () => {
	console.log("Download");
    let img = document.querySelector("#imageCanvas").toDataURL("image/png");
	let w = window.open('about:blank','Playground Image');
	w.document.write('<img src="'+ img +'"/>');
}, false);

document.querySelector('#reload').addEventListener('click', () => {
	mat = cv.imread(imgElement);
	cv.imshow('imageCanvas', mat);  
	strJS = `let src = cv.imread('YOUR_CANVAS_ID');\nlet dst = new cv.Mat();\n`;
}, false);

document.querySelector('#roi').addEventListener('click', () => {
	this.disabled = true;
	drawing = true;
	document.querySelector("#roi").style.background = '#ececec';
	canvas.style.cursor = "crosshair";

}, false);

document.querySelector('#filter_type').addEventListener('change', () => {
	if (document.querySelector('#filter_type').value === 'custom') {
		document.querySelector('#div_filter').style.display = "block";
	}
	else {
		document.querySelector('#div_filter').style.display = "none";
	}
}, false);

document.querySelector('#filter').addEventListener('click', () => {
	this.disabled = true;

	let src = cv.imread('imageCanvas'); 
	lastState = src.clone();
	strLastState = strJS;

	let dst = new cv.Mat();
	let filterType = document.querySelector('#filter_type').value;
	let kernel = parseInt(document.querySelector('#filter_kernel').value);
	
	if (filterType === 'blur') {
		let ksize = new cv.Size(kernel, kernel);
		let anchor = new cv.Point(-1, -1);
		cv.blur(src, dst, ksize, anchor, cv.BORDER_DEFAULT);

		strJS += `cv.blur(src, dst, new cv.Size(${kernel}, ${kernel}), new cv.Point(-1, -1), cv.BORDER_DEFAULT);\n`;
	}
	else if (filterType === 'gaussian') {
		let ksize = new cv.Size(kernel, kernel);
		cv.GaussianBlur(src, dst, ksize, 0, 0, cv.BORDER_DEFAULT);		
		strJS += `cv.GaussianBlur(src, dst, new cv.Size(${kernel}, ${kernel}), 0, 0, cv.BORDER_DEFAULT);\n`;
	}
	else if (filterType === 'median') {
		cv.medianBlur(src, dst, 3);
		strJS += `cv.medianBlur(src, dst, 3);\n`;
	}
	else {
		let arr1D = getMtxFromStr(document.querySelector('#custom_filter').value);
		let M = cv.matFromArray(kernel, kernel, cv.CV_8UC1, arr1D);
		//let M = cv.Mat.eye(kernel, kernel, cv.CV_32FC1);

		let anchor = new cv.Point(-1, -1);
		//cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
		cv.filter2D(src, dst, cv.CV_8U, M, anchor, 0, cv.BORDER_DEFAULT);
		M.delete();

		strJS += `cv.filter2D(src, dst, cv.CV_8U, cv.matFromArray(${kernel}, ${kernel}, cv.CV_8UC1, ${arr1D}), new cv.Point(-1, -1), 0, cv.BORDER_DEFAULT);\n`;
	}

	cv.imshow('imageCanvas', dst);
    src.delete();
    dst.delete();

}, false);

document.querySelector('#cvt_color').addEventListener('click', () => {
	this.disabled = true;

	let src = cv.imread('imageCanvas'); 
	lastState = src.clone();
	strLastState = strJS;

	let dst = new cv.Mat();
	let cvtType = document.querySelector('#cvt_type').value;
	
	cv.cvtColor(src, dst, eval(cvtType), 0);

	cv.imshow('imageCanvas', dst);
    src.delete();
	dst.delete();
	
	strJS += `cv.cvtColor(src, dst, ${cvtType}, 0);\n`;

}, false);

document.querySelector("#changeRoi").addEventListener('click', () => {
	letROI(startX, startY, moveX, moveY);
});

document.querySelector('#revert').addEventListener('click', () => {
	console.log("Step back!");
	strJS = strLastState;
	cv.imshow('imageCanvas', lastState);
});

document.querySelector('#generateJS').addEventListener('click', () => {
	// generate code
	console.log("Generating code...");
	document.querySelector("#code").style.display = 'block';
	document.querySelector("#js_code").innerText = strJS;
	// alert(strJS);
});

document.querySelector('#close').addEventListener('click', () => {
	document.querySelector("#code").style.display = 'none';
	document.querySelector("#js_code").innerText = '';
});

function getMtxFromStr(str) {
	// preprocess
	let arr1D = [];
	let arr = str.split('\n');
	for (let row of arr) {
		for (let col of row.split(',')){
			arr1D.push(parseFloat(col));
		}
	}
	console.log(arr1D);
	return arr1D;
}

function contourCentroid(M) {
	return new cv.Point(parseInt(M.m10/M.m00), parseInt(M.m01/M.m00));
}

function onOpenCvReady() {
  	document.body.classList.remove("loading");
}

function showBboxBtn() {
	let bbox = document.querySelector("#bbox_btn");
	bbox.style.visibility = 'visible';
}

function showCanvasBtns() {
	document.querySelector("#button").style.visibility = 'visible';
	document.querySelector("#reload").style.visibility = 'visible';
	document.querySelector("#roi").style.visibility = 'visible';
	document.querySelector("#revert").style.visibility = 'visible';
	document.querySelector("#generateJS").style.display = 'block';

	canvasPos = canvas.getBoundingClientRect();

	let btnList = document.querySelectorAll(".btn_apply");
	btnList.forEach((btn) => {
		btn.style.visibility = "visible";
	});
}

// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRgb(hex) {
	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
	  r: parseInt(result[1], 16),
	  g: parseInt(result[2], 16),
	  b: parseInt(result[3], 16)
	} : null;
}

function down(e) {
	startX = Math.round(e.clientX - canvasPos.left);
	startY = Math.round(e.clientY - canvasPos.top);
	moveX = startX; 
	moveY = startY;
	recursiveDrawer();
}
	
function up(e) {
	if (drawing === true) {
		document.querySelector("#roi").style.background = '#0000ff';
		canvas.style.cursor = "default";
	}
	drawing = false;
}

function move(e) {
	if (drawing == true) {
		moveX = Math.round(e.clientX - canvasPos.left);
		moveY = Math.round(e.clientY - canvasPos.top);
	}
}

function recursiveDrawer() {
	if (drawing === true) {
		mat = cv.imread(imgElement);
		cv.rectangle(mat, new cv.Point(startX, startY), new cv.Point(moveX, moveY), new cv.Scalar(255, 108, 0, 255), 2);	 
		cv.imshow('imageCanvas', mat); 
		setTimeout(recursiveDrawer, 12);
	}
}

function letROI() {
	let src = cv.imread('imageCanvas');
	lastState = src.clone();
	
	console.log(startX, startY, moveX-startX, startY-moveY)
	let logo = new cv.Mat();
	let rect2 = new cv.Rect(startX, startY, moveX-startX, moveY-startY);
	logo = src.roi(rect2);

	console.log(logo);

	let dst = new cv.Mat();
	let roi = new cv.Mat();
	let mask = new cv.Mat();
	let maskInv = new cv.Mat();
	let imgBg = new cv.Mat();
	let imgFg = new cv.Mat();
	let sum = new cv.Mat();
	cnts = new cv.MatVector();
	let hierarchy = new cv.Mat();

	let rect = new cv.Rect(startX, startY, moveX-startX, moveY-startY);

	// I want to put logo on top-left corner, So I create a ROI
	roi = src.roi(rect);

	// Create a mask of logo and create its inverse mask also
	cv.cvtColor(logo, mask, cv.COLOR_RGBA2GRAY, 0);

	cv.threshold(mask, mask, 100, 255, cv.THRESH_BINARY);
	cv.bitwise_not(mask, maskInv);

	// Black-out the area of logo in ROI
	cv.bitwise_and(roi, roi, imgBg, maskInv);

	// Take only region of logo from logo image
	cv.bitwise_and(logo, logo, imgFg, mask);

	// Put logo in ROI and modify the main image
	cv.add(imgBg, imgFg, sum);

	dst = src.clone();

	cv.findContours(mask, cnts, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
	document.querySelector('#cnts_count').innerText = `${ cnts.size() }`;

	for (let i = 0; i < cnts.size(); ++i) {
		let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255), Math.round(Math.random() * 255));
		cv.drawContours(dst, cnts, i, color, 1, cv.LINE_8, hierarchy, 100);
	}
	
	for (let i = 0; i < logo.rows; i++) {
		for (let j = 0; j < logo.cols; j++) {
			dst.ucharPtr(i, j)[0] = sum.ucharPtr(i, j)[0];
		}
	} 
	cv.imshow('imageCanvas', dst);
	src.delete(); dst.delete(); logo.delete(); roi.delete(); mask.delete();
	maskInv.delete(); imgBg.delete(); imgFg.delete(); sum.delete();
	hierarchy.delete(); 

	showBboxBtn();
	//contours.delete();  
 }