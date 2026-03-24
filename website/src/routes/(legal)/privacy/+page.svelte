<h1 class="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
<p class="text-neutral-500 text-sm mb-12">Last updated: March 2026</p>

<h2 class="text-xl font-semibold mt-10 mb-4">Introduction</h2>
<p class="text-neutral-400 leading-relaxed mb-4">
	Rekoll is a browser extension that helps you search your browsing history by meaning. We are
	committed to protecting your privacy. This policy explains what data Rekoll handles and how.
</p>

<h2 class="text-xl font-semibold mt-10 mb-4">Data Collection & Storage</h2>
<p class="text-neutral-400 leading-relaxed mb-4">
	Rekoll captures browsing interactions (page visits, text selections, form interactions) and
	extracts page content to create searchable vector embeddings. <strong>All data is stored locally
	on your device</strong> using IndexedDB. No data is ever transmitted to external servers, cloud
	services, or third parties. Zero cloud uploads.
</p>

<h2 class="text-xl font-semibold mt-10 mb-4">Local Processing</h2>
<p class="text-neutral-400 leading-relaxed mb-4">
	Rekoll uses a machine learning model (via HuggingFace Transformers) that runs entirely in your
	browser using WebAssembly. Your browsing data is processed on-device to generate semantic
	embeddings for natural language search. No data leaves your browser during this process.
</p>

<h2 class="text-xl font-semibold mt-10 mb-4">Browser Permissions</h2>
<p class="text-neutral-400 leading-relaxed mb-4">
	Rekoll requests the following browser permissions to function:
</p>
<ul class="list-disc list-inside text-neutral-400 leading-relaxed mb-4 space-y-1">
	<li>
		<strong>storage / unlimitedStorage</strong> — Store browsing data and embeddings locally
	</li>
	<li><strong>activeTab</strong> — Access content of the current tab when capturing</li>
	<li>
		<strong>webNavigation</strong> — Detect page navigations to trigger content capture
	</li>
	<li><strong>sidePanel</strong> — Display the search interface</li>
	<li>
		<strong>offscreen</strong> — Run the ML embedding model in a background document
	</li>
	<li><strong>alarms</strong> — Schedule periodic maintenance tasks</li>
</ul>

<h2 class="text-xl font-semibold mt-10 mb-4">No Analytics or Tracking</h2>
<p class="text-neutral-400 leading-relaxed mb-4">
	Rekoll does not include any analytics, telemetry, or tracking code. We do not collect usage
	statistics, crash reports, or any other behavioral data.
</p>

<h2 class="text-xl font-semibold mt-10 mb-4">Third-Party Services</h2>
<p class="text-neutral-400 leading-relaxed mb-4">
	Rekoll does not communicate with any third-party services. The extension operates entirely
	offline after installation.
</p>

<h2 class="text-xl font-semibold mt-10 mb-4">Data Deletion</h2>
<p class="text-neutral-400 leading-relaxed mb-4">
	You can delete all Rekoll data at any time by:
</p>
<ul class="list-disc list-inside text-neutral-400 leading-relaxed mb-4 space-y-1">
	<li>Clearing the extension's storage through your browser's extension settings</li>
	<li>Uninstalling the extension, which removes all associated data</li>
</ul>

<h2 class="text-xl font-semibold mt-10 mb-4">Changes to This Policy</h2>
<p class="text-neutral-400 leading-relaxed mb-4">
	We may update this policy from time to time. Changes will be posted on this page with an updated
	revision date.
</p>

<h2 class="text-xl font-semibold mt-10 mb-4">Contact</h2>
<p class="text-neutral-400 leading-relaxed mb-4">
	If you have questions about this privacy policy, please open an issue on our
	<a
		href="https://github.com/MarcusGasberg/rekoll"
		class="text-neutral-200 underline hover:text-white transition-colors">GitHub repository</a
	>.
</p>
