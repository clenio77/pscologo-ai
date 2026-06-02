import re

def check_tags(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Find the JSX return block roughly
    jsx_start = content.find('return (')
    if jsx_start == -1:
        print("No return ( found")
        return
    
    jsx_end = content.rfind(');')
    jsx = content[jsx_start:jsx_end]

    # regex to find tags <Tag> or </Tag> or <Tag/>
    tags = re.findall(r'<\/?([a-zA-Z0-9.]+)[^>]*>', jsx)
    
    stack = []
    for tag in re.finditer(r'<(\/)?([a-zA-Z0-9.]+)[^>]*(\/)?>', jsx):
        is_closing = tag.group(1) == '/'
        tag_name = tag.group(2)
        is_self_closing = tag.group(3) == '/'
        
        if is_self_closing:
            continue
            
        if is_closing:
            if not stack:
                print(f"Error: Closing tag {tag_name} without open tag")
                return
            last = stack.pop()
            if last != tag_name:
                print(f"Error: Closing tag {tag_name} does not match {last}")
                return
        else:
            stack.append(tag_name)
            
    print("Unclosed tags:", stack)

check_tags('/home/clenio/Documentos/Meusagentes/pscologo_ai/frontend/src/components/PsicologoDashboard.js')
