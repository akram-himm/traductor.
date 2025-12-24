// Basic PDF.js viewer implementation
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs/pdf.worker.min.js';

const urlParams = new URLSearchParams(window.location.search);
const pdfUrl = urlParams.get('file');

const container = document.getElementById('container');
const loading = document.getElementById('loading');
let pdfDoc = null;
let scale = 1.5; // Meilleure qualité par défaut

async function renderPage(num) {
    const page = await pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale });

    // Utiliser devicePixelRatio pour une meilleure qualité sur écrans HD
    const outputScale = window.devicePixelRatio || 1;

    const pageDiv = document.createElement('div');
    pageDiv.className = 'pdf-page';
    pageDiv.style.width = `${viewport.width}px`;
    pageDiv.style.height = `${viewport.height}px`;

    const canvas = document.createElement('canvas');
    // Augmenter la résolution du canvas pour meilleure qualité
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    pageDiv.appendChild(canvas);

    const context = canvas.getContext('2d');

    // Appliquer le scaling pour la haute résolution
    const transform = outputScale !== 1
        ? [outputScale, 0, 0, outputScale, 0, 0]
        : null;

    const renderContext = {
        canvasContext: context,
        viewport: viewport,
        transform: transform
    };

    await page.render(renderContext).promise;

    // Text Selection Layer - Improved
    const textContent = await page.getTextContent();
    const textLayerDiv = document.createElement('div');
    textLayerDiv.className = 'textLayer';
    textLayerDiv.style.width = `${viewport.width}px`;
    textLayerDiv.style.height = `${viewport.height}px`;
    pageDiv.appendChild(textLayerDiv);

    // Grouper les items de texte par ligne pour une meilleure sélection
    let currentLine = [];
    let lastY = null;
    const lines = [];

    textContent.items.forEach((item, index) => {
        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
        const y = tx[5];

        // Nouvelle ligne si Y change significativement
        if (lastY !== null && Math.abs(y - lastY) > 5) {
            if (currentLine.length > 0) {
                lines.push([...currentLine]);
                currentLine = [];
            }
        }

        currentLine.push({ item, tx });
        lastY = y;

        // Dernière ligne
        if (index === textContent.items.length - 1 && currentLine.length > 0) {
            lines.push(currentLine);
        }
    });

    // Rendre chaque ligne comme un span unique
    lines.forEach(line => {
        if (line.length === 0) return;

        const firstItem = line[0];
        const lastItem = line[line.length - 1];

        const fontHeight = Math.sqrt((firstItem.tx[2] * firstItem.tx[2]) + (firstItem.tx[3] * firstItem.tx[3]));
        const left = firstItem.tx[4];
        const top = firstItem.tx[5] - fontHeight;

        // Calculer la largeur totale de la ligne
        const lastTx = lastItem.tx;
        const lastWidth = lastItem.item.width * lastTx[0];
        const width = (lastTx[4] + lastWidth) - left;

        // Combiner tout le texte de la ligne
        const text = line.map(l => l.item.str).join('');

        const span = document.createElement('span');
        span.textContent = text;
        span.style.position = 'absolute';
        span.style.left = `${left}px`;
        span.style.top = `${top}px`;
        span.style.fontSize = `${fontHeight}px`;
        span.style.fontFamily = 'sans-serif';
        span.style.whiteSpace = 'pre'; // Préserver les espaces
        span.style.color = 'transparent';
        span.style.cursor = 'text';

        textLayerDiv.appendChild(span);
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
