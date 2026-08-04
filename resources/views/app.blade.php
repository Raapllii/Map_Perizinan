<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Perizinan</title>
    @php
        $isDev = file_exists(public_path('hot'));
        $manifestPath = public_path('build/manifest.json');
        $manifest = file_exists($manifestPath) ? json_decode(file_get_contents($manifestPath), true) : [];
    @endphp

    @if ($isDev)
        <script type="module">
          import RefreshRuntime from "http://localhost:5173/@react-refresh"
          RefreshRuntime.injectIntoGlobalHook(window)
          window.$RefreshReg$ = () => {}
          window.$RefreshSig$ = () => (type) => type
          window.__vite_plugin_react_preamble_installed__ = true
        </script>
        <script type="module" src="http://localhost:5173/@vite/client"></script>
        <script type="module" src="http://localhost:5173/resources/js/main.tsx"></script>
    @else
        @if(isset($manifest['resources/js/main.tsx']))
            @if(isset($manifest['resources/js/main.tsx']['css']))
                @foreach($manifest['resources/js/main.tsx']['css'] as $cssFile)
                    <link rel="stylesheet" href="/build/{{ $cssFile }}">
                @endforeach
            @endif
            <script type="module" src="/build/{{ $manifest['resources/js/main.tsx']['file'] }}"></script>
        @endif
    @endif
</head>
<body class="bg-gray-50 text-gray-900 antialiased font-sans">
    <div id="root"></div>
</body>
</html>
