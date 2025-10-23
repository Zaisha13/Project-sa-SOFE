// profile.js - handle profile load/save, photo upload, and password reset
(function(){
  const KEY = 'currentUser';

  function $(id){ return document.getElementById(id); }

  function loadProfile(){
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch(e) { return null; }
  }

  function saveProfile(user){
    localStorage.setItem(KEY, JSON.stringify(user));
  }

  function dataURLFromFile(file, cb){
    const reader = new FileReader();
    reader.onload = () => cb(reader.result);
    reader.readAsDataURL(file);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const user = loadProfile() || {};
    const originalUsername = user.username || null;
    const originalEmail = user.email || null;

  const photoImg = $('profile-photo');
  const photoInput = $('photo-input');
  const removeBtn = $('remove-photo');
  const photoFilename = $('photo-filename');

    // Populate fields
    $('name').value = user.name || '';
    $('gender').value = user.gender || '';
    $('age').value = user.age || '';
    $('username').value = user.username || '';
    $('email').value = user.email || '';
    $('phone').value = user.phone || '';
    $('address').value = user.address || '';

  const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='240' height='240' fill='none' stroke='%232E5D47' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><rect x='2' y='5' width='20' height='14' rx='2' ry='2'/><circle cx='12' cy='12' r='3'/><path d='M8 5l1.5-2h5L16 5'/></svg>";
  if (user.photo) photoImg.src = user.photo; else photoImg.src = DEFAULT_AVATAR;

    photoInput.addEventListener('change', (e)=>{
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      // show filename
      if (photoFilename) photoFilename.textContent = f.name || 'Selected file';
      dataURLFromFile(f, (dataUrl)=>{
        photoImg.src = dataUrl;
        user.photo = dataUrl;
        saveProfile(user);
        showToast('success','Saved','Profile photo updated');
      });
    });

    removeBtn.addEventListener('click', ()=>{
  photoImg.src = DEFAULT_AVATAR;
      delete user.photo;
      saveProfile(user);
      if (photoFilename) photoFilename.textContent = 'No file chosen';
      // clear native input so same file can be re-chosen if desired
      if (photoInput) photoInput.value = '';
      showToast('info','Removed','Profile photo removed');
    });

    // helper validators
    function setError(id, msg){
      const el = $(id);
      if (!el) return;
      el.textContent = msg || '';
    }
    function markInvalid(inputEl, isInvalid){
      if (!inputEl) return;
      if (isInvalid) inputEl.classList.add('invalid'); else inputEl.classList.remove('invalid');
    }

    // Save profile with inline validation and phone normalization
    $('save-profile').addEventListener('click', ()=>{
      const name = $('name').value.trim();
      const username = $('username').value.trim();
      const email = $('email').value.trim();
      const age = $('age').value.trim();
      const phone = $('phone').value.trim();

      let ok = true;
      // name
      if (!name) { setError('err-name','Name is required'); markInvalid($('name'), true); ok = false; } else { setError('err-name',''); markInvalid($('name'), false); }
      // username
      if (!username) { setError('err-username','Username is required'); markInvalid($('username'), true); ok = false; } else { setError('err-username',''); markInvalid($('username'), false); }
      // email basic
      const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!email || !emailRe.test(email)) { setError('err-email','Valid email is required'); markInvalid($('email'), true); ok = false; } else { setError('err-email',''); markInvalid($('email'), false); }
      // age optional but if provided numeric range
      if (age) {
        const a = Number(age);
        if (isNaN(a) || a < 0 || a > 120) { setError('err-age','Enter a valid age'); markInvalid($('age'), true); ok = false; } else { setError('err-age',''); markInvalid($('age'), false); }
      } else { setError('err-age',''); markInvalid($('age'), false); }
      // phone normalization (accepts local numbers and adds +63)
      if (phone) {
        const normalized = normalizePhone(phone);
        if (!normalized) { setError('err-phone','Enter a valid phone'); markInvalid($('phone'), true); ok = false; } else { setError('err-phone',''); markInvalid($('phone'), false); $('phone').value = normalized; }
      } else { setError('err-phone',''); markInvalid($('phone'), false); }

      if (!ok) return showToast('error','Validation failed','Please fix highlighted fields');

      // uniqueness checks against registered users
      const users = JSON.parse(localStorage.getItem('jessie_users') || '[]');
      const usernameTaken = users.some(u => u.username === username && u.username !== originalUsername);
      const emailTaken = users.some(u => u.email === email && u.email !== originalEmail);
      if (usernameTaken) { setError('err-username','Username already taken'); markInvalid($('username'), true); ok = false; }
      if (emailTaken) { setError('err-email','Email already in use'); markInvalid($('email'), true); ok = false; }
      if (!ok) return showToast('error','Validation failed','Username or email already used');

      // update local jessie_users store: update matching user or add if not present
      const phoneVal = $('phone').value.trim();
      const addrVal = $('address').value.trim();

      const matchIndex = users.findIndex(u => (originalUsername && u.username === originalUsername) || (originalEmail && u.email === originalEmail));
      if (matchIndex >= 0) {
        // merge changes into stored user
        users[matchIndex] = Object.assign({}, users[matchIndex], {
          name: name,
          username: username,
          email: email,
          phone: phoneVal,
          address: addrVal,
          gender: $('gender').value,
          age: $('age').value,
          photo: user.photo || users[matchIndex].photo
        });
      } else {
        // not found in registered users - append as a customer record
        users.push({
          name: name,
          username: username,
          email: email,
          password: user.password || '',
          role: user.role || 'customer',
          dateCreated: user.dateCreated || new Date().toISOString(),
          phone: phoneVal,
          address: addrVal,
          gender: $('gender').value,
          age: $('age').value,
          photo: user.photo || null
        });
      }

      localStorage.setItem('jessie_users', JSON.stringify(users));

      // update currentUser record
      user.name = name;
      user.gender = $('gender').value;
      user.age = $('age').value;
      user.username = username;
      user.email = email;
      user.phone = phoneVal;
      user.address = addrVal;

      saveProfile(user);
      showToast('success','Saved','Profile updated');
    });

    // phone normalization on blur
    $('phone').addEventListener('blur', (e)=>{
      const v = e.target.value.trim();
      if (!v) return;
      const n = normalizePhone(v);
      if (n) e.target.value = n;
    });

    function normalizePhone(v){
      // strip non-digits
      const digits = v.replace(/[^0-9+]/g,'');
      if (digits.startsWith('+')) {
        const d = digits.replace(/[^0-9]/g,'');
        return d.length >= 8 ? `+${d}` : null;
      }
      if (digits.startsWith('0') && digits.length >= 10) {
        return '+63' + digits.replace(/^0+/, '');
      }
      if (digits.length === 9 || digits.length === 10) {
        return '+63' + digits.replace(/^0+/, '');
      }
      if (digits.startsWith('63') && digits.length >= 11) return '+' + digits;
      return null;
    }

    // Password modal wiring
    const pwModal = $('pw-modal');
    const pwCancel = $('pw-cancel');
    const pwSave = $('pw-save');

    $('reset-password').addEventListener('click', ()=>{
      pwModal.setAttribute('aria-hidden','false');
    });
    pwCancel.addEventListener('click', ()=> pwModal.setAttribute('aria-hidden','true'));

    pwSave.addEventListener('click', ()=>{
      const cur = $('current-pw').value || '';
      const nw = $('new-pw').value || '';
      const conf = $('confirm-pw').value || '';
      const stored = loadProfile() || {};
      const storedPw = stored.password || '';

      if (!cur || !nw || !conf) return showToast('error','Missing','Please fill all password fields');
      if (cur !== storedPw) return showToast('error','Incorrect','Current password is incorrect');
      if (nw.length < 6) return showToast('error','Weak','New password should be at least 6 chars');
      if (nw !== conf) return showToast('error','Mismatch','New passwords do not match');

      // update stored password
      stored.password = nw;
      saveProfile(stored);
      pwModal.setAttribute('aria-hidden','true');
      $('current-pw').value = $('new-pw').value = $('confirm-pw').value = '';
      showToast('success','Saved','Password updated');
    });
  });

})();
