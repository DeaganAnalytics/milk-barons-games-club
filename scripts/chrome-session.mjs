export async function connectChrome(debuggerUrl) {
  const tabs = await (await fetch(new URL('/json/list', debuggerUrl))).json();
  const socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, {once: true});
    socket.addEventListener('error', reject, {once: true});
  });
  const pending = new Map();
  const events = [];
  let id = 0;
  socket.addEventListener('message', ({data}) => {
    const reply = JSON.parse(data);
    if (!reply.id) {
      events.push(reply);
      return;
    }
    const {resolve, reject} = pending.get(reply.id);
    pending.delete(reply.id);
    if (reply.error) reject(Error(JSON.stringify(reply.error)));
    else resolve(reply.result);
  });
  function send(method, params = {}) {
    const request = ++id;
    return new Promise((resolve, reject) => {
      pending.set(request, {resolve, reject});
      socket.send(JSON.stringify({id: request, method, params}));
    });
  }
  async function evaluate(expression) {
    const reply = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
    if (reply.exceptionDetails) throw Error(JSON.stringify(reply.exceptionDetails));
    return reply.result.value;
  }
  return {send, evaluate, events, close: () => socket.close()};
}
