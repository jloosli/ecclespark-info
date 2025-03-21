const scripts = [
"https://accounts.google.com/gsi/client" ,
"https://apis.google.com/js/api.js" ,
"https://cdn.jsdelivr.net/npm/temporal-polyfill@0.2.5/global.min.js"
];

function loadScripts(scripts: string[]): void {
    scripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    });
}


export default () => loadScripts(scripts);