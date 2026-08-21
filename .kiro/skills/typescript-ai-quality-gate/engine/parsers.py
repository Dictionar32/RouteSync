from __future__ import annotations
import json, re
from typing import Any


def _finding(analyzer, rule, path='', line=None, col=None, severity='error', message='', **extra):
    x={'analyzer': analyzer, 'rule': rule or 'diagnostic', 'path': path or '',
       'severity': 'warning' if str(severity).lower() in ('warn','warning') else str(severity).lower(),
       'message': message or ''}
    if line is not None: x['line']=int(line)
    if col is not None: x['column']=int(col)
    x.update(extra)
    return x


def _native_json(tool: str, text: str):
    try:
        data=json.loads(text)
    except (json.JSONDecodeError, TypeError, ValueError):
        return None
    t=(tool or '').lower()
    out=[]
    if t in {'eslint','eslint-json'}:
        for item in data if isinstance(data,list) else []:
            path=item.get('filePath') or item.get('file') or ''
            for m in item.get('messages',[]) or []:
                sev={1:'warning',2:'error'}.get(m.get('severity'),'info')
                out.append(_finding('eslint',m.get('ruleId') or 'eslint',path,m.get('line'),m.get('column'),sev,m.get('message',''),end_line=m.get('endLine'),end_column=m.get('endColumn')))
        return out
    if t in {'biome','biome-json'}:
        diagnostics=[]
        if isinstance(data,dict):
            diagnostics=data.get('diagnostics') or data.get('errors') or []
        for d in diagnostics:
            cat=d.get('category') or d.get('rule') or d.get('code') or 'biome'
            msg=d.get('description') or d.get('message') or d.get('messageText') or ''
            sev=d.get('severity') or ('error' if d.get('category')=='error' else 'warning')
            loc=d.get('location') or d.get('range') or {}
            path=d.get('path') or d.get('filePath') or ''
            if isinstance(loc,dict):
                start=loc.get('start') or loc.get('from') or {}
                if isinstance(start,dict): line=start.get('line'); col=start.get('column')
                else: line=col=None
            else: line=col=None
            out.append(_finding('biome',cat,path,line,col,sev,msg))
        return out
    if t in {'shellcheck','shellcheck-json'}:
        items=data if isinstance(data,list) else data.get('comments',[]) if isinstance(data,dict) else []
        for d in items:
            sev=d.get('level') or d.get('severity') or 'warning'
            out.append(_finding('shellcheck',str(d.get('code') or 'shellcheck'),d.get('file') or d.get('filename') or '',d.get('line'),d.get('column'),sev,d.get('message',''),end_line=d.get('endLine'),end_column=d.get('endColumn')))
        return out
    if t in {'cargo-json','rustc-json','cargo'}:
        stream=data if isinstance(data,list) else [data]
        for d in stream:
            if d.get('reason') not in (None,'compiler-message'): continue
            msg=d.get('message') or d.get('rendered')
            if not msg: continue
            lvl=(msg.get('level') if isinstance(msg,dict) else None) or 'error'
            spans=(msg.get('spans') if isinstance(msg,dict) else []) or []
            primary=next((s for s in spans if s.get('is_primary')), spans[0] if spans else {})
            out.append(_finding('rustc',msg.get('code',{}).get('code') if isinstance(msg,dict) and isinstance(msg.get('code'),dict) else 'compiler-diagnostic',primary.get('file_name',''),primary.get('line_start'),primary.get('column_start'),lvl,(msg.get('message','') if isinstance(msg,dict) else str(msg))))
        return out
    if t in {'phpstan-json','phpstan'}:
        msgs=data.get('files',{}) if isinstance(data,dict) else {}
        for path, item in msgs.items():
            for m in item.get('messages',[]) if isinstance(item,dict) else []:
                out.append(_finding('phpstan',m.get('identifier') or 'phpstan',path,m.get('line'),None,m.get('severity','error'),m.get('message','')))
        return out
    if t in {'phpcs-json','phpcs'}:
        files=data.get('files',{}) if isinstance(data,dict) else {}
        for path,item in files.items():
            for m in item.get('messages',[]) if isinstance(item,dict) else []:
                out.append(_finding('phpcs',m.get('source') or 'phpcs',path,m.get('line'),m.get('column'),m.get('type','warning'),m.get('message','')))
        return out
    return None



def _native_json_lines(tool: str, text: str):
    """Parse JSON Lines streams such as `cargo --message-format=json`.
    Returns (findings, valid_count, invalid_count) or None when no JSON object is found.
    """
    objs=[]; invalid=0
    for raw in (text or '').splitlines():
        line=raw.strip()
        if not line: continue
        try: objs.append(json.loads(line))
        except Exception: invalid += 1
    if not objs: return None
    findings=_native_json(tool, json.dumps(objs))
    return findings if findings is not None else None, len(objs), invalid

def _text_parse(tool,text):
    t=(tool or '').lower(); out=[]
    rx=re.compile(r'^(.*?):(\d+)(?::(\d+))?\s+(error|warning|warn|info)\s+([A-Za-z0-9_./:-]+)\s*(.*)$',re.I)
    for raw in text.splitlines():
        m=rx.match(raw.strip())
        if m:
            path,line,col,sev,rule,msg=m.groups()
            out.append(_finding(t,rule,path,line,col,sev,msg)); continue
        m=re.match(r'^\s*(?:error|warning)(?:\[([^\]]+)\])?:\s*(.*)$',raw)
        if m: out.append(_finding(t,m.group(1) or 'compiler-diagnostic','',None,None,'error' if raw.strip().startswith('error') else 'warning',m.group(2)))
    return out


def normalize(tool, stdout, stderr, returncode):
    # Parse machine-readable stdout independently. Diagnostic chatter on stderr must
    # never invalidate an otherwise valid JSON report.
    out=(stdout or '').strip()
    err=(stderr or '').strip()
    if (tool or '').lower() in {'cargo-json','cargo'} and out:
        stream=_native_json_lines(tool,out)
        if stream is not None:
            findings, valid_count, invalid_count=stream
            return {'parser':f'{tool}-native-v28.4','parser_kind':'native',
                    'parse_status':'PARTIAL' if invalid_count else 'COMPLETE',
                    'implementation':'native-jsonl-v28.4','tool_status':'PASS' if returncode==0 else 'FAIL',
                    'finding_count':len(findings),'findings':findings,
                    'jsonl_records':valid_count,'jsonl_invalid_lines':invalid_count,
                    'stderr_diagnostics':err}
    native=_native_json(tool,out)
    if native is not None:
        return {'parser':f'{tool}-native-v28.4','parser_kind':'native','parse_status':'COMPLETE',
                'implementation':'native-json-v28.4','tool_status':'PASS' if returncode==0 else 'FAIL',
                'finding_count':len(native),'findings':native,'stderr_diagnostics':err}
    # Some wrappers emit the JSON report on stderr.
    if err:
        native=_native_json(tool,err)
        if native is not None:
            return {'parser':f'{tool}-native-v28.4','parser_kind':'native','parse_status':'COMPLETE',
                    'implementation':'native-json-v28.4','tool_status':'PASS' if returncode==0 else 'FAIL',
                    'finding_count':len(native),'findings':native,'stderr_diagnostics':err}
    text='\n'.join(x for x in (out,err) if x)
    findings=_text_parse(tool,text)
    return {'parser':f'{tool or "generic"}-structured-v28.4','parser_kind':'structured-fallback',
            'parse_status':'PARTIAL' if text else 'UNSUPPORTED',
            'implementation':'structured-text-v28.4','tool_status':'PASS' if returncode==0 else 'FAIL',
            'finding_count':len(findings),'findings':findings}
