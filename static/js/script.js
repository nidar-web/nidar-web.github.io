class BeforeAfter {
    constructor(options) {
        const container = document.querySelector(options.id);
        const before = container.querySelector('.bal-before');
        const inset = container.querySelector('.bal-before-inset');
        const afterText = container.querySelector('.bal-afterPosition');
        const handle = container.querySelector('.bal-handle');

        const resize = () => {
            inset.style.width = container.offsetWidth + 'px';
        };
        resize();
        window.addEventListener('resize', resize);
        before.style.width = '50%';
        handle.style.left = '50%';

        const move = (clientX) => {
            const bounds = container.getBoundingClientRect();
            const offset = clientX - bounds.left;
            if (offset <= 10 || offset >= bounds.width - 10) return;
            const position = (offset * 100 / bounds.width) + '%';
            before.style.width = position;
            handle.style.left = position;
            afterText.style.zIndex = '1';
        };
        container.addEventListener('mousemove', (event) => move(event.clientX));
        container.addEventListener('touchmove', (event) => {
            if (event.changedTouches.length) move(event.changedTouches[0].clientX);
        }, { passive: true });
    }
}
