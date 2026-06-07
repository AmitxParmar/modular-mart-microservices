import sys
import pathlib
import json

def main():
    graph_path = pathlib.Path('graphify-out/graph.json')
    result = {'decision': 'allow'}
    
    if graph_path.exists():
        msg = (
            'graphify: knowledge graph at graphify-out/. For focused questions, '
            'run "graphify query <question>" (scoped subgraph, usually much smaller '
            'than GRAPH_REPORT.md) instead of grepping raw files. Read GRAPH_REPORT.md '
            'only for broad architecture context.'
        )
        result['additionalContext'] = msg
        
    sys.stdout.write(json.dumps(result))

if __name__ == '__main__':
    main()
