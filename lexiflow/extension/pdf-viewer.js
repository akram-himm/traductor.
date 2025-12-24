// Basic PDF.js viewer implementation
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs/pdf.worker.min.js';

const urlParams = new URLSearchParams(window.location.search);
const pdfUrl = urlParams.get('file');

const container = document.getElementById('container');
const loading = document.getElementById('loading');
let pdfDoc = null;
let scale = 1.2;

async function renderPage(num) {
    const page = await pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale });

    const pageDiv = document.createElement('div');
    pageDiv.className = 'pdf-page';
    pageDiv.style.width = `${viewport.width}px`;
    pageDiv.style.height = `${viewport.height}px`;

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    pageDiv.appendChild(canvas);

    const context = canvas.getContext('2d');
    const renderContext = {
        canvasContext: context,
        viewport: viewport,
    };

    await page.render(renderContext).promise;

    // Text Selection Layer
    const textContent = await page.getTextContent();
    const textLayerDiv = document.createElement('div');
    textLayerDiv.className = 'textLayer';
    textLayerDiv.style.width = `${viewport.width}px`;
    textLayerDiv.style.height = `${viewport.height}px`;
    pageDiv.appendChild(textLayerDiv);

    // Custom simple text layer rendering (since we don't have full pdf_viewer.js)
    // We place spans based on transform
    textContent.items.forEach(item => {
        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
        const fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
        const div = document.createElement('span');
        div.textContent = item.str;
        div.style.left = `${tx[4]}px`;
        div.style.top = `${tx[5] - fontHeight}px`;
        div.style.fontSize = `${fontHeight}px`;
        div.style.fontFamily = 'sans-serif'; // Simplified

        // transform is [scaleX, skewY, skewX, scaleY, translateX, translateY]
        // PDF.js text layer is complex, this is a simplified approach for selection.
        // Ideally we'd use pdfjs-dist/web/pdf_viewer.js but that's huge. 
        // This allows text selection which is what we need for the icon.

        textLayerDiv.appendChild(div);
    });

    container.appendChild(pageDiv);
}

async function loadPdf() {
    if (!pdfUrl) {
        loading.textContent = 'No PDF file specified.';
        return;
    }

    try {
        loading.textContent = 'Loading...';
        pdfDoc = await pdfjsLib.getDocument(pdfUrl).promise;
        loading.style.display = 'none';
        document.getElementById('pageCount').textContent = `${pdfDoc.numPages} Pages`;

        for (let i = 1; i <= pdfDoc.numPages; i++) {
            await renderPage(i);
        }
    } catch (err) {
        console.error(err);
        loading.textContent = 'Error loading PDF: ' + err.message;
    }
}

// Zoom handlers
document.getElementById('zoomIn').addEventListener('click', () => {
    scale += 0.2;
    container.innerHTML = ''; // efficient re-render? no, but simple.
    loadPdf();
    document.getElementById('zoomLevel').textContent = `${Math.round(scale * 100)}%`;
});

document.getElementById('zoomOut').addEventListener('click', () => {
    if (scale > 0.4) {
        scale -= 0.2;
        container.innerHTML = '';
        loadPdf();
        document.getElementById('zoomLevel').textContent = `${Math.round(scale * 100)}%`;
    }
});

loadPdf();
