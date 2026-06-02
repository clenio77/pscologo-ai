import re

with open('src/App.js', 'r') as f:
    lines = f.readlines()

v2_start = -1
v3_start = -1
v2_end = -1
v3_end = -1

for i, line in enumerate(lines):
    if '// VISTA 2:' in line:
        v2_start = i
    if '// VISTA 3:' in line:
        v3_start = i
        v2_end = i - 1

v3_end = len(lines) - 3 # before the final '  );' and '}'

v2_lines = lines[v2_start:v2_end]
v3_lines = lines[v3_start:v3_end]

# For now, let's just see if we found them correctly
print(f"V2: {v2_start} to {v2_end}")
print(f"V3: {v3_start} to {v3_end}")

# Replace in App.js
new_app = lines[:v2_start]
new_app.append("  if (usuario.tipo === 'psicologo') {\n")
new_app.append("    return <PsicologoDashboard {...props} />;\n")
new_app.append("  }\n\n")
new_app.append("  return <PacienteDashboard {...props} />;\n")
new_app.append("}\n\nexport default App;\n")

# This is a simplification. We will need to define `props` object in App.js before these returns.
