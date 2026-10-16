const menuButton = document.querySelector('.menu-button');
const navLinks = document.querySelector('.nav-links');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  navLinks.classList.toggle('open', !open);
});
navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menuButton.setAttribute('aria-expanded', 'false');
  navLinks.classList.remove('open');
}));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const money = value => `₹${Math.round(value).toLocaleString('en-IN')}`;
const team = document.querySelector('#team-size');
const salary = document.querySelector('#salary');
function updateCalculator() {
  const seats = Number(team.value);
  const pay = Number(salary.value);
  const payroll = seats * pay * 0.042;
  const travel = seats * 700;
  document.querySelector('#team-output').textContent = `${seats} people`;
  document.querySelector('#salary-output').textContent = `${money(pay)} / mo`;
  document.querySelector('#savings').textContent = money(payroll + travel);
  document.querySelector('#payroll-saving').textContent = money(payroll);
  document.querySelector('#travel-saving').textContent = money(travel);
}
[team, salary].forEach(input => input.addEventListener('input', updateCalculator));
updateCalculator();

document.querySelectorAll('[data-billing]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-billing]').forEach(item => item.classList.toggle('active', item === button));
  document.querySelectorAll('.price strong[data-monthly]').forEach(price => {
    price.textContent = price.dataset[button.dataset.billing];
  });
}));

const dialog = document.querySelector('#tour-dialog');
document.querySelector('[data-tour]').addEventListener('click', () => dialog.showModal());
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

document.querySelector('#lead-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const note = document.querySelector('#form-note');
  note.textContent = 'Thanks — your request is ready. We’ll be in touch shortly.';
  note.style.color = '#0b6b66';
  form.querySelector('button').textContent = 'Request received ✓';
  form.querySelector('button').disabled = true;
});
