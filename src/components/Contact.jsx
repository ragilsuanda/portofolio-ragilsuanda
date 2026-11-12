import { useState } from 'react';
import './Contact.css';

/* Ganti dengan datamu sendiri */
const EMAIL = 'ahmad20dahalan@gmail.com';
const PHONE = '0895386974754';
const LOCATION = 'Pekanbaru,Riau,Indonesia';

/* Tempel endpoint Formspree kamu di sini, contoh: https://formspree.io/f/mqkrabcd */
const FORM_ENDPOINT = 'https://formspree.io/f/xvkaovgj';

const SERVICES = ['Brand & Strategy', 'Marketing & Campaign', 'Creative Digital', 'Other'];

const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/ragil.suanda?mdxt=MXhhaHNuYXZlendweQ==' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ragil-suanda-8a460829b?utm_source=share_via&utm_content=profile&utm_medium=member_android' },
  { label: 'GitHub', href: 'https://github.com/ragilsuanda' },
  { label: 'Tiktok', href: 'https://www.tiktok.com/@wkkwkwkwwkwkw?_r=1&_t=ZS-9BL2BWUEyzR' },
];

const INITIAL = { name: '', email: '', service: SERVICES[0], message: '' };

function Contact() {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const err = {};
    if (!form.name.trim()) err.name = 'Nama wajib diisi';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = 'Email tidak valid';
    if (form.message.trim().length < 10) err.message = 'Pesan minimal 10 karakter';
    return err;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    setErrors(err);
    if (Object.keys(err).length) return;

    setSending(true);
    setFailed(false);

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email, // otomatis jadi alamat "reply-to"
          service: form.service,
          message: form.message,
          _subject: `[${form.service}] Pesan dari ${form.name}`,
        }),
      });

      if (!res.ok) throw new Error('Gagal mengirim');

      setSent(true);
      setForm(INITIAL);
      setTimeout(() => setSent(false), 5000);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="Contact" id="contact">
      <div className="Contact-wrapper">
        <div className="Contact-container">
          {/* ── Kiri: info ── */}
          <div className="Contact-info">
            <h2 className="Contact-title">
              Let&apos;s create something <span>extraordinary</span> together.
            </h2>
            <ul className="Contact-list">
              <li>
                <span className="Contact-list-key">EMAIL</span>
                <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
              </li>
              <li>
                <span className="Contact-list-key">PHONE</span>
                <a href={`tel:${PHONE.replace(/\s/g, '')}`}>{PHONE}</a>
              </li>
              <li>
                <span className="Contact-list-key">LOCATION</span>
                <span>{LOCATION}</span>
              </li>
            </ul>

            <div className="Contact-socials">
              {SOCIALS.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
                  {s.label}
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7M8 7h9v9" />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* ── Kanan: form ── */}
          <form className="Contact-form" onSubmit={handleSubmit} noValidate>
            <div className="Contact-field">
              <label htmlFor="c-name">Name</label>
              <input
                id="c-name"
                type="text"
                placeholder="Your full name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className={errors.name ? 'has-error' : ''}
              />
              {errors.name && <small>{errors.name}</small>}
            </div>

            <div className="Contact-field">
              <label htmlFor="c-email">Email</label>
              <input
                id="c-email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className={errors.email ? 'has-error' : ''}
              />
              {errors.email && <small>{errors.email}</small>}
            </div>

            <div className="Contact-field">
              <label>I&apos;m interested in</label>
              <div className="Contact-chips">
                {SERVICES.map((s) => (
                  <button
                    type="button"
                    key={s}
                    className={`Contact-chip ${form.service === s ? 'is-active' : ''}`}
                    onClick={() => update('service', s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="Contact-field">
              <label htmlFor="c-message">Message</label>
              <textarea
                id="c-message"
                rows="5"
                placeholder="Ceritakan tentang proyekmu..."
                value={form.message}
                onChange={(e) => update('message', e.target.value)}
                className={errors.message ? 'has-error' : ''}
              />
              {errors.message && <small>{errors.message}</small>}
            </div>

            <button type="submit" className="Contact-submit" disabled={sending}>
              {sending ? 'SENDING...' : 'SEND MESSAGE'}
              <span className="Contact-submit-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M8 7h9v9" />
                </svg>
              </span>
            </button>

            {sent && (
              <p className="Contact-success" role="status">
                ✓ Terima kasih! Pesanmu sudah terkirim.
              </p>
            )}

            {failed && (
              <p className="Contact-success" role="alert" style={{ color: '#e5484d' }}>
                Maaf, pesan gagal terkirim. Coba lagi atau email langsung ke {EMAIL}.
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

export default Contact;
