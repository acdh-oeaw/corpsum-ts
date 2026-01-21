<script setup lang="ts">
const props = defineProps<{
	query: string;
}>();

const tokenizeCql = (input: string) => {
	const tokens: Array<string> = [];
	let buffer = "";
	let inQuotes = false;
	let escapeNext = false;

	const pushBuffer = () => {
		if (buffer) {
			tokens.push(buffer);
			buffer = "";
		}
	};

	const pushToken = (token: string) => {
		pushBuffer();
		tokens.push(token);
	};

	const twoCharOperators = new Set(["!=", "=~", "!~", ">=", "<="]);
	const singleCharOperators = new Set(["[", "]", "(", ")", "|", "&", "=", "<", ">"]);

	for (let index = 0; index < input.length; index += 1) {
		const char = input[index];

		if (inQuotes) {
			buffer += char;
			if (escapeNext) {
				escapeNext = false;
			} else if (char === "\\") {
				escapeNext = true;
			} else if (char === '"') {
				inQuotes = false;
				pushBuffer();
			}
			continue;
		}

		if (char === '"') {
			pushBuffer();
			buffer = '"';
			inQuotes = true;
			continue;
		}

		if (/\s/.test(char)) {
			pushBuffer();
			continue;
		}

		const next = input[index + 1];
		if (next && twoCharOperators.has(`${char}${next}`)) {
			pushToken(`${char}${next}`);
			index += 1;
			continue;
		}

		if (singleCharOperators.has(char)) {
			pushToken(char);
			continue;
		}

		buffer += char;
	}

	pushBuffer();
	return tokens;
};

const prettyCql = (input: string) => {
	const tokens = tokenizeCql(input.trim());
	const lines: Array<string> = [];
	let indent = 0;
	let line = "";

	const indentText = () => "  ".repeat(indent);
	const flush = () => {
		if (line.trim()) {
			lines.push(line);
			line = "";
		}
	};

	for (const token of tokens) {
		if (token === "[" || token === "(") {
			flush();
			lines.push(`${indentText()}${token}`);
			indent += 1;
			continue;
		}

		if (token === "]" || token === ")") {
			flush();
			indent = Math.max(0, indent - 1);
			lines.push(`${indentText()}${token}`);
			continue;
		}

		if (token === "|" || token === "&") {
			flush();
			line = `${indentText()}${token}`;
			continue;
		}

		if (!line) {
			line = `${indentText()}${token}`;
		} else {
			line += ` ${token}`;
		}
	}

	flush();
	return lines.join("\n");
};

const formattedQuery = computed(() => prettyCql(props.query ?? ""));
</script>

<template>
	<pre class="whitespace-pre-wrap rounded-md border bg-muted/20 px-1 py-0.5 text-[11px] leading-4">
		{{ formattedQuery }}
	</pre
	>
</template>
