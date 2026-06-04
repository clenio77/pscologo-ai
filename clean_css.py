import re

with open('src/pages/Login.css', 'r') as f:
    content = f.read()
content = re.sub(r'\.demo-banner \{.*?\n\}\n\n\.demo-banner-icon \{.*?\n\}\n', '', content, flags=re.DOTALL)
with open('src/pages/Login.css', 'w') as f:
    f.write(content)

with open('src/components/Layout.css', 'r') as f:
    content = f.read()
content = re.sub(r'\.demo-badge \{.*?\n\}\n\n\.demo-badge span \{.*?\n\}\n\n@media.*?\n\}\n', '', content, flags=re.DOTALL)
with open('src/components/Layout.css', 'w') as f:
    f.write(content)

print("Cleaned CSS")
