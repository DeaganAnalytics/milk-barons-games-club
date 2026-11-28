// Install before navigation so the same rule applies to every tested conversation.
export async function installPipDialogueCheck(send) {
  await send('Page.addScriptToEvaluateOnNewDocument', {source: `(() => {
    const inspect = () => {
      const panel = document.getElementById('conversation');
      const line = document.getElementById('conversation-line');
      if (!panel || panel.hidden || !line || line.hidden) return;
      if (document.getElementById('conversation-title')?.textContent.trim() !== 'Pip') return;
      const spoken = [...line.childNodes]
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent).join('').trim();
      if (spoken) throw new Error('Pip dialogue must be a response button: ' + spoken);
    };
    new MutationObserver(inspect).observe(document, {
      subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: ['hidden', 'data-speaking-side']
    });
  })()`});
}
