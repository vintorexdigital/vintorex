const form = document.querySelector('#offer-form');
const [choose, brief] = form.querySelectorAll('fieldset');
const ready = form.querySelector('[data-ready]');
function step(panel) {
  for (const section of [choose, brief, ready]) {
    section.hidden = section !== panel;
    if (section.tagName === 'FIELDSET') section.disabled = section.hidden;
  }
  panel.querySelector('select, input, a')?.focus();
}
form.hidden = false;
form.querySelector('[data-next]').onclick = () => {
  if (form.elements.service.reportValidity()) step(brief);
};
form.querySelector('[data-back]').onclick = () => step(choose);
form.querySelector('[data-edit]').onclick = () => step(brief);
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!choose.hidden) {
    step(brief);
    return;
  }
  const { name, service, goal } = form.elements;
  const message = `Hello Vintorex, I’m ${name.value.trim()}.\nService: ${service.value}\nProject goal: ${goal.value.trim()}`;
  const link = new URL(form.dataset.whatsapp);
  link.searchParams.set('text', message);
  ready.querySelector('[data-preview]').textContent = message;
  ready.querySelector('[data-send]').href = link.href;
  step(ready);
});
