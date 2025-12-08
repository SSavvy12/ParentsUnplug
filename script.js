

document.addEventListener("DOMContentLoaded", () => {
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  /* ---------------- Quote of the Day ---------------- */
  const quotes = [
    "Parenting is a journey, not a destination. — Unknown",
    "There is no such thing as a perfect parent. — Unknown",
    "The days are long, but the years are short. — Gretchen Rubin",
    "One of the greatest titles in the world is parent. — Unknown",
    "You are doing a great job. — Parents Unplugged"
  ];
  const qEl = $("#quote-of-day");
  if (qEl) {
    const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % quotes.length;
    qEl.textContent = quotes[dayIndex];
  }

  /* ---------------- Storage keys and helpers ---------------- */
  const POSTS_KEY = "pu_posts_v1";
  const REVIEWS_KEY = "pu_reviews_v1";
  const COMMENTS_KEY = "pu_comments_v1";
  const POLL_KEY = "pu_poll_v1";
  const POLL_VOTES_KEY = "pu_poll_votes_v1";
  const ANON_NAME_KEY = "pu_anon_name"; 
  const ALIASES_KEY = "pu_aliases_v1"; 

  const defaultPoll = {
    question: "What's your biggest parenting challenge this week?",
    options: { sleep:0, feeding:0, behavior:0, balancing:0 },
    total: 0
  };

  function getPosts(){ try{ return JSON.parse(localStorage.getItem(POSTS_KEY) || "[]"); }catch{return [];} }
  function savePosts(arr){ localStorage.setItem(POSTS_KEY, JSON.stringify(arr)); renderAllPosts(); }

  function getReviews(){ try{ return JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]"); }catch{return [];} }
  function saveReviews(arr){ localStorage.setItem(REVIEWS_KEY, JSON.stringify(arr)); renderReviews(); }

  function getAllComments(){ try{ return JSON.parse(localStorage.getItem(COMMENTS_KEY) || "{}"); }catch{return {}; } }
  function saveAllComments(obj){ localStorage.setItem(COMMENTS_KEY, JSON.stringify(obj)); }

  function getPoll(){ try{ return JSON.parse(localStorage.getItem(POLL_KEY) || JSON.stringify(defaultPoll)); }catch{return defaultPoll;} }
  function savePoll(p){ localStorage.setItem(POLL_KEY, JSON.stringify(p)); renderPoll(); }

  function getPollVotes(){ try{ return JSON.parse(localStorage.getItem(POLL_VOTES_KEY) || "{}"); } catch { return {}; } }
  function savePollVotes(v){ localStorage.setItem(POLL_VOTES_KEY, JSON.stringify(v)); }

  function getAnonName(){ try{ return localStorage.getItem(ANON_NAME_KEY) || ""; } catch { return ""; } }
  function setAnonName(name){ localStorage.setItem(ANON_NAME_KEY, name); }
  function clearAnonName(){ localStorage.removeItem(ANON_NAME_KEY); }

  function getAliases(){ try{ return JSON.parse(localStorage.getItem(ALIASES_KEY) || "{}"); } catch { return {}; } }
  function saveAliases(obj){ localStorage.setItem(ALIASES_KEY, JSON.stringify(obj)); }
  function getAliasForUser(username){ if (!username) return ""; const a = getAliases(); return a[username] || ""; }
  function setAliasForUser(username, alias){ if (!username) return; const a = getAliases(); a[username] = alias; saveAliases(a); }
  function clearAliasForUser(username){ if (!username) return; const a = getAliases(); delete a[username]; saveAliases(a); }

  function hasUserVoted(pollId, username){
    if (!username) return false;
    const votes = getPollVotes();
    return !!(votes[pollId] && votes[pollId].usernames && votes[pollId].usernames[username]);
  }
  function markUserVoted(pollId, username){
    if (!username) return;
    const votes = getPollVotes();
    if (!votes[pollId]) votes[pollId] = { usernames: {} };
    votes[pollId].usernames[username] = true;
    savePollVotes(votes);
  }

  function escapeHtml(s){ if (!s) return ""; return String(s).replace(/[&<>"'`=\/]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[c])); }
  function capital(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

  /* ---------------- Alias / anonymous modal wiring ---------------- */
  const aliasOverlay = $("#alias-modal-overlay");
  const aliasInput = $("#alias-input");
  const aliasSaveBtn = $("#alias-save");
  const aliasCancelBtn = $("#alias-cancel");
  const aliasError = $("#alias-error");

  
  function openAliasModal({ forUser=null, isAnon=false, required=false } = {}) {
    aliasError.textContent = "";
    aliasInput.value = "";
    aliasOverlay.style.display = "flex";
    aliasOverlay.setAttribute("aria-hidden", "false");
    aliasInput.focus();

    if (forUser) {
      const existing = getAliasForUser(forUser);
      if (existing) aliasInput.value = existing;
    } else if (isAnon) {
      const existingAnon = getAnonName();
      if (existingAnon) aliasInput.value = existingAnon;
    }

    if (required) {
      aliasCancelBtn.style.display = "none";
      aliasOverlay.onclick = (e) => {
        e.stopPropagation();
      };
    } else {
      aliasCancelBtn.style.display = "inline-block";
      aliasOverlay.onclick = (e) => {
        if (e.target === aliasOverlay) closeModal();
      };
    }

    aliasSaveBtn.disabled = false;
    aliasSaveBtn.onclick = onSave;
    aliasCancelBtn.onclick = () => {
      closeModal();
    };

    function closeModal(){
      aliasOverlay.style.display = "none";
      aliasOverlay.setAttribute("aria-hidden", "true");
      aliasError.textContent = "";
      aliasInput.onkeydown = null;
      aliasSaveBtn.onclick = null;
      aliasCancelBtn.onclick = null;
      aliasOverlay.onclick = null;
    }

    function onSave(){
      aliasError.textContent = "";
      const raw = aliasInput.value || "";
      const name = raw.trim();
      if (name.length < 3) { aliasError.textContent = "Nickname must be at least 3 characters."; aliasInput.focus(); return; }
      if (forUser) {
        if (name === forUser) { aliasError.textContent = "Nickname cannot match your account username. Pick a different alias."; aliasInput.focus(); return; }
        setAliasForUser(forUser, name);
      } else {
        setAnonName(name);
      }
      applyAliasToUI();
      closeModal();
      setTimeout(()=> alert("Thanks — your nickname has been saved."), 50);
    }

    // allow Enter to save
    aliasInput.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); onSave(); } };
  }

  function showAliasIfNeededOnBlogPage() {
    if (!window.location.pathname.includes("FinalBlog.html")) return;
    const reg = getRegisteredUser();
    if (reg && reg.username) {
      const alias = getAliasForUser(reg.username);
      if (!alias) {
        setTimeout(()=> openAliasModal({ forUser: reg.username, required: false }), 300);
      } else {
        applyAliasToUI();
      }
      return;
    }
    if (!getAnonName()) {
      setTimeout(()=> openAliasModal({ isAnon:true, required: false }), 300);
      return;
    }
    applyAliasToUI();
  }

  // Reviews page: require nickname selection 
  function showAliasRequiredOnReviewsPage() {
    if (!window.location.pathname.includes("Reviews.html")) return;
    const reg = getRegisteredUser();
    if (reg && reg.username) {
      const alias = getAliasForUser(reg.username);
      if (!alias) {
        setTimeout(()=> openAliasModal({ forUser: reg.username, required: true }), 200);
        return;
      } else {
        applyAliasToUI();
        return;
      }
    }
    // anonymous visitor
    if (!getAnonName()) {
      setTimeout(()=> openAliasModal({ isAnon:true, required: true }), 200);
      return;
    }
    applyAliasToUI();
  }

  /* ---------------- Anonymous-handle helpers (UI) ---------------- */
  function ensureAnonUIBindings(){
    // Post form anon controls (blog)
    const postNameInput = $("#post-name");
    const changeAnonPostBtn = $("#change-anon-post-name");
    if (postNameInput) {
      applyAnonLockToInput(postNameInput, changeAnonPostBtn);
    }
    // Review form anon controls (reviews page)
    const reviewNameInput = $("#review-name");
    const changeAnonReviewBtn = $("#change-anon-review-name");
    if (reviewNameInput) {
      applyAnonLockToInput(reviewNameInput, changeAnonReviewBtn);
    }
    // wire change buttons
    const changeBtnPost = $("#change-anon-post-name");
    if (changeBtnPost) {
      changeBtnPost.onclick = () => {
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.username) {
          if (!confirm("Change your blog handle? This will affect future posts. Continue?")) return;
          openAliasModal({ forUser: currentUser.username, required: false });
        } else {
          if (!confirm("Change anonymous handle? This will affect future posts. Continue?")) return;
          openAliasModal({ isAnon:true, required: false });
        }
      };
    }
    const changeBtnReview = $("#change-anon-review-name");
    if (changeBtnReview) {
      changeBtnReview.onclick = () => {
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.username) {
          if (!confirm("Change your review handle? This will affect future reviews. Continue?")) return;
          openAliasModal({ forUser: currentUser.username, required: false });
        } else {
          if (!confirm("Change anonymous handle? This will affect future reviews. Continue?")) return;
          openAliasModal({ isAnon:true, required: false });
        }
      };
    }
  }

  function applyAnonLockToInput(inputEl, changeButtonEl){
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.username) {
      const alias = getAliasForUser(currentUser.username);
      if (alias) {
        inputEl.value = alias;
        inputEl.disabled = true;
        if (changeButtonEl) { changeButtonEl.style.display = "inline-block"; changeButtonEl.textContent = "Change blog handle"; }
        return;
      } else {
        inputEl.disabled = false;
        if (changeButtonEl) changeButtonEl.style.display = "none";
        return;
      }
    }
    const anon = getAnonName();
    if (anon) {
      inputEl.value = anon;
      inputEl.disabled = true;
      if (changeButtonEl) { changeButtonEl.style.display = "inline-block"; changeButtonEl.textContent = "Change anonymous name"; }
    } else {
      inputEl.value = "";
      inputEl.disabled = false;
      if (changeButtonEl) changeButtonEl.style.display = "none";
    }
  }

  function applyAliasToUI(){
    // set post-name and review-name inputs appropriately
    const postNameInput = $("#post-name");
    const reviewNameInput = $("#review-name");
    const current = getCurrentUser();
    if (current && current.username) {
      const alias = getAliasForUser(current.username);
      if (alias) {
        if (postNameInput) { postNameInput.value = alias; postNameInput.disabled = true; $("#change-anon-post-name").style.display = "inline-block"; $("#change-anon-post-name").textContent = "Change blog handle"; }
        if (reviewNameInput) { reviewNameInput.value = alias; reviewNameInput.disabled = true; $("#change-anon-review-name").style.display = "inline-block"; $("#change-anon-review-name").textContent = "Change blog handle"; }
      } else {
        if (postNameInput) { postNameInput.disabled = false; $("#change-anon-post-name").style.display = "none"; }
        if (reviewNameInput) { reviewNameInput.disabled = false; $("#change-anon-review-name").style.display = "none"; }
      }
    } else {
      const anon = getAnonName();
      if (anon) {
        if (postNameInput) { postNameInput.value = anon; postNameInput.disabled = true; $("#change-anon-post-name").style.display = "inline-block"; $("#change-anon-post-name").textContent = "Change anonymous name"; }
        if (reviewNameInput) { reviewNameInput.value = anon; reviewNameInput.disabled = true; $("#change-anon-review-name").style.display = "inline-block"; $("#change-anon-review-name").textContent = "Change anonymous name"; }
      } else {
        if (postNameInput) { postNameInput.value = ""; postNameInput.disabled = false; $("#change-anon-post-name").style.display = "none"; }
        if (reviewNameInput) { reviewNameInput.value = ""; reviewNameInput.disabled = false; $("#change-anon-review-name").style.display = "none"; }
      }
    }
  }

  function ensureAnonExistsOrPrompt(forWhat){
    const anon = getAnonName();
    if (getCurrentUser() && getCurrentUser().username) return true;
    if (anon) return true;
    let name = prompt(`You're not signed in. Enter a persistent anonymous name to use when ${forWhat} (min 3 chars):`);
    if (!name) return false;
    name = name.trim();
    if (name.length < 3) { alert("Name must be at least 3 characters."); return false; }
    setAnonName(name);
    ensureAnonUIBindings();
    return true;
  }

  /* ---------------- Poll rendering (no reset button) ---------------- */
  function renderPoll(){
    const widget = $(".poll-widget");
    if (!widget) return;
    const poll = getPoll();

    widget.innerHTML = `<h4>${escapeHtml(poll.question)}</h4>
      <div>${Object.keys(poll.options).map(k=>{
        const v = poll.options[k];
        const pct = poll.total ? Math.round((v/poll.total)*100) : 0;
        return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <label style="flex:0 0 auto"><input type="radio" name="pu_poll_choice" value="${k}"> ${escapeHtml(capital(k))}</label>
          <div style="flex:1">
            <div style="height:8px;background:#eee;border-radius:6px;overflow:hidden"><div style="width:${pct}%;height:100%;background:linear-gradient(90deg,var(--accent),var(--primary));"></div></div>
            <div style="font-size:12px;color:var(--muted);margin-top:4px">${v} vote(s) • ${pct}%</div>
          </div>
        </div>`;
      }).join("")}
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="vote-btn">Vote</button>
      </div>
      <div class="poll-feedback" style="margin-top:8px;font-size:13px;color:var(--muted)"></div>
    `;

    const voteBtn = widget.querySelector(".vote-btn");
    const feedbackEl = widget.querySelector(".poll-feedback");
    function lockUIForVotedUser(msg){
      widget.querySelectorAll('input[name="pu_poll_choice"]').forEach(i => i.disabled = true);
      if (voteBtn) { voteBtn.disabled = true; voteBtn.textContent = 'Voted'; }
      if (feedbackEl) feedbackEl.textContent = msg || 'You have already voted.';
    }

    const reg = getCurrentUser();
    const pollId = 'main-poll';
    if (reg && reg.username && hasUserVoted(pollId, reg.username)) {
      lockUIForVotedUser('You already voted for this poll.');
    } else {
      if (feedbackEl) feedbackEl.textContent = 'Sign in to vote (one vote per user).';
    }

    if (voteBtn) {
      voteBtn.addEventListener("click", ()=>{
        const choice = widget.querySelector('input[name="pu_poll_choice"]:checked');
        if (!choice){ if (feedbackEl) feedbackEl.textContent = "Please choose an option."; return; }
        const user = getCurrentUser();
        if (!user || !user.username) {
          if (feedbackEl) feedbackEl.textContent = "Please sign in to vote.";
          return;
        }
        if (hasUserVoted(pollId, user.username)) {
          lockUIForVotedUser('You already voted for this poll.');
          return;
        }
        const p = getPoll();
        p.options[choice.value] = (p.options[choice.value]||0)+1;
        p.total = (p.total||0)+1;
        savePoll(p);
        markUserVoted(pollId, user.username);
        lockUIForVotedUser('Thanks — your vote was counted.');
      });
    }
  }

  /* ---------------- Deletion helpers ---------------- */
  function deletePost(id){
    if (!confirm("Delete this post? This will remove the post and its comments permanently (in this browser).")) return;
    const posts = getPosts().filter(p => String(p.id) !== String(id));
    savePosts(posts);
    const comments = getAllComments();
    delete comments['post_'+id];
    saveAllComments(comments);
    if (window.location.pathname.includes("post.html")) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("id") === String(id)) {
        window.location.href = "FinalBlog.html";
        return;
      }
    }
    renderAllPosts();
  }

  function deleteReview(id){
    if (!confirm("Delete this review? This will remove the review and its comments permanently (in this browser).")) return;
    const reviews = getReviews().filter(r => String(r.id) !== String(id));
    saveReviews(reviews);
    const comments = getAllComments();
    delete comments['review_'+id];
    saveAllComments(comments);
    if (window.location.pathname.includes("review.html")) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("id") === String(id)) {
        window.location.href = "Reviews.html";
        return;
      }
    }
    renderReviews();
  }

  /* ---------------- Posts rendering (feed + user blogs) ---------------- */
  function renderAllPosts(){
    renderPostsGrid();
    renderUserBlogsGrid();
  }

  function renderPostsGrid(){
    const grids = document.querySelectorAll(".blog-grid");
    if (!grids.length) return;
    const posts = getPosts();
    const comments = getAllComments();
    const current = getCurrentUser();

    grids.forEach(grid => {
      if (!posts || posts.length === 0){
        grid.innerHTML = `<div class="blog-post" style="text-align:center;padding:24px;">
          <div style="font-weight:600;color:#222">Be the first to blog</div>
          <p style="color:#555">Your post will appear here.</p>
          <div><a href="FinalBlog.html"><button>Share a Story</button></a></div>
        </div>`;
        return;
      }

      grid.innerHTML = posts.map(post => {
        const time = new Date(post.time).toLocaleString();
        const text = escapeHtml(post.text);
        const thumb = post.imageDataUrl ? `<div class="thumb"><img src="${post.imageDataUrl}" alt=""></div>` : '';
        const key = 'post_'+post.id;
        const arr = (comments[key] || []);
        const previewHtml = arr.slice(0,2).map(c => `<div class="comment-mini"><strong>${escapeHtml(c.name)}</strong> • ${new Date(c.time).toLocaleString()}<div style="margin-top:6px">${escapeHtml(c.text)}</div></div>`).join('');
        const previewArea = previewHtml ? `<div class="comments-preview">${previewHtml}</div>` : `<div class="comments-preview" style="color:#666">No comments yet — be the first to reply.</div>`;
        const count = arr.length;
        const canDelete = current && current.username && (current.username === post.name);
        const deleteButtonHtml = canDelete ? `<button class="btn-delete" data-id="${post.id}" title="Delete post">Delete</button>` : '';

        return `<div class="blog-post" data-id="${post.id}">
          <a href="post.html?id=${post.id}" style="text-decoration:none;color:inherit;">
            ${thumb}
            <div class="content">
              <strong>${escapeHtml(post.name || 'Anonymous')}</strong>
              <div class="meta">${time}</div>
              <p style="margin-top:8px">${text.length > 260 ? text.slice(0,260)+'…' : text}</p>
            </div>
          </a>
          ${previewArea}
          <div style="display:flex;gap:8px;align-items:center;">
            <button class="toggle-post-comments" data-id="${post.id}">Show comments (${count})</button>
            <a href="post.html?id=${post.id}" style="margin-left:auto"><button class="secondary" type="button">Open Post</button></a>
            ${deleteButtonHtml}
          </div>
          <div id="post-comments-${post.id}" class="post-comments" style="display:none"></div>
        </div>`;
      }).join("");
    });

    attachPostHandlers();
  }

  function renderUserBlogsGrid(){
    const grid = $("#user-blog-grid");
    if (!grid) return;
    const posts = getPosts();
    const reg = getRegisteredUser();
    const current = getCurrentUser();
    if (!reg && !getAnonName()){
      grid.innerHTML = `<div class="blog-post" style="text-align:center;padding:18px"><div style="font-weight:600">Your blogs</div><p style="color:#555">Your posts (when you create them) will appear here. Sign in or choose an anonymous name to get started.</p></div>`;
      return;
    }
    const ownerName = reg ? (getAliasForUser(reg.username) || reg.username) : getAnonName();
    const mine = posts.filter(p => p.name === ownerName);
    if (mine.length === 0){
      grid.innerHTML = `<div class="blog-post" style="text-align:center;padding:18px"><div style="font-weight:600">You haven't posted yet</div><p style="color:#555">Write your first story!</p><div><a href="FinalBlog.html"><button>Write a Story</button></a></div></div>`;
      return;
    }

    const comments = getAllComments();
    grid.innerHTML = mine.map(post => {
      const time = new Date(post.time).toLocaleString();
      const text = escapeHtml(post.text);
      const thumb = post.imageDataUrl ? `<div class="thumb"><img src="${post.imageDataUrl}" alt=""></div>` : '';
      const key = 'post_'+post.id;
      const arr = (comments[key]||[]);
      const preview = arr.slice(0,2).map(c => `<div class="comment-mini"><strong>${escapeHtml(c.name)}</strong> • ${new Date(c.time).toLocaleString()}<div style="margin-top:6px">${escapeHtml(c.text)}</div></div>`).join('');
      const count = arr.length;
      const canDelete = current && current.username && (current.username === post.name);
      const deleteButtonHtml = canDelete ? `<button class="btn-delete" data-id="${post.id}" title="Delete post">Delete</button>` : '';

      return `<div class="blog-post" data-id="${post.id}">
        <a href="post.html?id=${post.id}" style="text-decoration:none;color:inherit;">
          ${thumb}
          <div class="content"><strong>${escapeHtml(post.name)}</strong><div class="meta">${time}</div><p style="margin-top:8px">${text.length>260?text.slice(0,260)+'…':text}</p></div>
        </a>
        ${preview ? `<div class="comments-preview">${preview}</div>` : `<div class="comments-preview" style="color:#666">No comments yet</div>`}
        <div style="display:flex;gap:8px;align-items:center;">
          <button class="toggle-post-comments" data-id="${post.id}">Show comments (${count})</button>
          <a href="post.html?id=${post.id}" style="margin-left:auto"><button class="secondary">Open Post</button></a>
          ${deleteButtonHtml}
        </div>
        <div id="post-comments-${post.id}" class="post-comments" style="display:none"></div>
      </div>`;
    }).join("");

    attachPostHandlers();
  }

  /* ---------------- attach post handlers ---------------- */
  function attachPostHandlers(){
    document.querySelectorAll(".toggle-post-comments").forEach(btn => {
      btn.removeEventListener?.("click", ()=>{});
      btn.addEventListener("click", (e)=>{
        const id = btn.dataset.id;
        const container = document.getElementById(`post-comments-${id}`);
        if (!container) return;
        if (container.style.display === "none" || container.style.display === "") {
          container.style.display = "block";
          renderPostComments(id, container);
          btn.textContent = "Hide comments";
        } else {
          container.style.display = "none";
          btn.textContent = `Show comments (${(getAllComments()['post_'+id]||[]).length})`;
        }
      });
    });

    document.querySelectorAll(".btn-delete").forEach(b => {
      b.addEventListener("click", (e)=>{
        const id = b.dataset.id;
        deletePost(id);
      });
    });
  }

  /* ---------------- Post comment UI ---------------- */
  function renderPostComments(postId, container){
    const key = 'post_'+postId;
    const all = getAllComments();
    const arr = all[key] || [];
    let html = '';
    if (arr.length === 0) {
      html += `<div style="color:#666;margin-bottom:8px">No comments yet — be the first to reply kindly.</div>`;
    } else {
      html += arr.map(c => `<div class="comment"><div class="meta"><strong>${escapeHtml(c.name)}</strong> • ${new Date(c.time).toLocaleString()}</div><div>${escapeHtml(c.text)}</div></div>`).join('');
    }
    html += `<div style="margin-top:8px">
      <input id="post-comment-name-${postId}" placeholder="Your name (optional)" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;margin-top:6px">
      <textarea id="post-comment-text-${postId}" rows="3" placeholder="Write a comment..." style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;margin-top:8px"></textarea>
      <div style="margin-top:6px"><button id="post-comment-submit-${postId}" type="button">Post Comment</button></div>
    </div>`;
    container.innerHTML = html;

    const submit = document.getElementById(`post-comment-submit-${postId}`);
    if (submit) submit.addEventListener("click", ()=>{
      const name = document.getElementById(`post-comment-name-${postId}`).value.trim() || "Anonymous";
      const text = document.getElementById(`post-comment-text-${postId}`).value.trim();
      if (!text) { alert("Please enter a comment."); return; }
      const allComments = getAllComments();
      allComments[key] = allComments[key] || [];
      allComments[key].push({ name, text, time: new Date().toISOString() });
      saveAllComments(allComments);
      renderPostComments(postId, container);
      renderAllPosts();
    });
  }

  /* ---------------- Reviews rendering + linking ---------------- */
  function renderReviews(){
    const grid = document.querySelector(".reviews-grid");
    if (!grid) return;
    const reviews = getReviews();
    const comments = getAllComments();
    const current = getCurrentUser();

    if (!reviews || reviews.length === 0) {
      grid.innerHTML = `<div class="review-card" style="text-align:center;padding:20px"><div style="font-weight:600">No reviews yet</div><p style="color:#555">Be the first to review a product.</p></div>`;
      return;
    }

    grid.innerHTML = reviews.map(r => {
      const time = new Date(r.time).toLocaleString();
      const thumb = r.imageDataUrl ? `<div class="thumb"><img src="${r.imageDataUrl}" alt=""></div>` : '';
      const key = 'review_'+r.id;
      const arr = comments[key] || [];
      const preview = arr.slice(0,2).map(c => `<div class="comment-mini"><strong>${escapeHtml(c.name)}</strong> • ${new Date(c.time).toLocaleString()}<div style="margin-top:6px">${escapeHtml(c.text)}</div></div>`).join('');
      const count = arr.length;

      const canDelete = current && current.username && (current.username === r.name);
      const deleteButtonHtml = canDelete ? `<button class="btn-delete-review" data-id="${r.id}" title="Delete review">Delete</button>` : '';

      const openButtonHtml = `<a href="review.html?id=${r.id}" style="margin-left:auto"><button class="secondary" type="button">Open Review</button></a>`;

      return `<div class="review-card" data-id="${r.id}">
        ${thumb}
        <div style="font-weight:600">${escapeHtml(r.name || 'Anonymous')}</div>
        <div class="meta">${time} • ${count} comment(s)</div>
        <p style="margin-top:8px">${escapeHtml(r.text.length>300? r.text.slice(0,300)+'…' : r.text)}</p>
        ${preview ? `<div class="comments-preview">${preview}</div>` : `<div style="color:#666">No comments yet</div>`}
        <div style="display:flex;gap:8px;align-items:center;margin-top:8px;">
          <button class="toggle-review-comments" data-id="${r.id}">Show comments (${count})</button>
          ${openButtonHtml}
          ${deleteButtonHtml}
        </div>
        <div id="review-comments-${r.id}" class="review-comments" style="display:none"></div>
      </div>`;
    }).join("");

    document.querySelectorAll(".toggle-review-comments").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = btn.dataset.id;
        const container = document.getElementById(`review-comments-${id}`);
        if (!container) return;
        if (container.style.display === "none" || container.style.display === "") {
          container.style.display = "block";
          renderReviewComments(id, container);
          btn.textContent = "Hide comments";
        } else {
          container.style.display = "none";
          btn.textContent = `Show comments (${(getAllComments()['review_'+id]||[]).length})`;
        }
      });
    });

    document.querySelectorAll(".btn-delete-review").forEach(b => {
      b.addEventListener("click", () => deleteReview(b.dataset.id));
    });
  }

  function renderReviewComments(reviewId, container){
    const key = 'review_'+reviewId;
    const arr = getAllComments()[key] || [];
    let html = '';
    if (arr.length === 0) html += `<div style="color:#666;margin-bottom:8px">No comments yet — be the first to reply kindly.</div>`;
    else html += arr.map(c => `<div class="comment"><div class="meta"><strong>${escapeHtml(c.name)}</strong> • ${new Date(c.time).toLocaleString()}</div><div>${escapeHtml(c.text)}</div></div>`).join('');
    html += `<div style="margin-top:8px">
      <input id="review-comment-name-${reviewId}" placeholder="Your name (optional)" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;margin-top:6px">
      <textarea id="review-comment-text-${reviewId}" rows="3" placeholder="Write a comment..." style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;margin-top:8px"></textarea>
      <div style="margin-top:6px"><button id="review-comment-submit-${reviewId}" type="button">Post Comment</button></div>
    </div>`;
    container.innerHTML = html;
    const submit = document.getElementById(`review-comment-submit-${reviewId}`);
    if (submit) submit.addEventListener("click", ()=>{
      const name = document.getElementById(`review-comment-name-${reviewId}`).value.trim() || "Anonymous";
      const text = document.getElementById(`review-comment-text-${reviewId}`).value.trim();
      if (!text) { alert("Please enter a comment."); return; }
      const all = getAllComments();
      all[key] = all[key] || [];
      all[key].push({ name, text, time: new Date().toISOString() });
      saveAllComments(all);
      renderReviewComments(reviewId, container);
      renderReviews();
    });
  }

  /* ---------------- Single post / single review rendering ---------------- */
  function renderSinglePost(){
    if (!window.location.pathname.includes("post.html")) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const container = $(".post-detail");
    if (!container) return;
    if (!id) { container.innerHTML = "<p>No post id provided.</p>"; return; }
    const posts = getPosts();
    const post = posts.find(p => String(p.id) === String(id));
    if (!post) { container.innerHTML = "<p>Post not found.</p>"; return; }

    const current = getCurrentUser();
    const canDelete = current && current.username && (current.username === post.name);
    const deleteBtnHtml = canDelete ? `<button id="delete-single-post" class="btn-delete" data-id="${post.id}">Delete Post</button>` : '';

    container.innerHTML = `<h2>${escapeHtml(post.name || 'Anonymous')}</h2>
      <div class="meta">${new Date(post.time).toLocaleString()}</div>
      ${post.imageDataUrl ? `<div style="margin-top:12px"><img src="${post.imageDataUrl}" style="width:100%;max-height:420px;object-fit:cover;border-radius:8px" alt=""></div>`:""}
      <div class="post-body" style="margin-top:12px"><p style="white-space:pre-wrap">${escapeHtml(post.text)}</p></div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <a href="FinalBlog.html"><button class="secondary">Back to Feed</button></a>
        ${deleteBtnHtml}
      </div>
      <section class="comments" style="margin-top:18px">
        <h3>Comments</h3>
        <div id="comments-list"></div>
        <div style="margin-top:10px">
          <input id="comment-name" placeholder="Your name (optional)" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px">
          <textarea id="comment-text" rows="4" placeholder="Write a supportive comment..." style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;margin-top:8px"></textarea>
          <div style="margin-top:8px"><button id="comment-submit">Post Comment</button></div>
        </div>
      </section>`;

    renderCommentsFor('post_'+id, $('#comments-list'));

    const submit = $("#comment-submit");
    if (submit) submit.addEventListener("click", ()=>{
      const name = $("#comment-name").value.trim() || "Anonymous";
      const text = $("#comment-text").value.trim();
      if (!text) { alert("Enter a comment."); return; }
      const all = getAllComments();
      all['post_'+id] = all['post_'+id] || [];
      all['post_'+id].push({ name, text, time: new Date().toISOString() });
      saveAllComments(all);
      $("#comment-text").value = "";
      renderCommentsFor('post_'+id, $('#comments-list'));
      renderAllPosts();
    });

    const delBtn = $("#delete-single-post");
    if (delBtn) delBtn.addEventListener("click", ()=> deletePost(id));
  }

  function renderCommentsFor(key, container){
    const arr = getAllComments()[key] || [];
    if (!container) return;
    if (arr.length === 0) { container.innerHTML = `<div style="color:#666">No comments yet.</div>`; return; }
    container.innerHTML = arr.map(c=>`<div class="comment"><div class="meta"><strong>${escapeHtml(c.name)}</strong> • ${new Date(c.time).toLocaleString()}</div><div>${escapeHtml(c.text)}</div></div>`).join('');
  }

  function renderSingleReview(){
    if (!window.location.pathname.includes("review.html")) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const container = $(".review-detail");
    if (!container) return;
    if (!id) { container.innerHTML = "<p>No review id provided.</p>"; return; }
    const reviews = getReviews();
    const review = reviews.find(r => String(r.id) === String(id));
    if (!review) { container.innerHTML = "<p>Review not found.</p>"; return; }

    const current = getCurrentUser();
    const canDelete = current && current.username && (current.username === review.name);
    const deleteBtnHtml = canDelete ? `<button id="delete-single-review" class="btn-delete-review" data-id="${review.id}">Delete Review</button>` : '';

    const comments = getAllComments()['review_'+id] || [];

    container.innerHTML = `<h2>${escapeHtml(review.name || 'Anonymous')}</h2>
      <div class="meta">${new Date(review.time).toLocaleString()}</div>
      ${review.imageDataUrl ? `<div style="margin-top:12px"><img src="${review.imageDataUrl}" style="width:100%;max-height:420px;object-fit:cover;border-radius:8px" alt=""></div>` : ''}
      <div class="post-body" style="margin-top:12px"><p style="white-space:pre-wrap">${escapeHtml(review.text)}</p></div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <a href="Reviews.html"><button class="secondary">Back to Reviews</button></a>
        ${deleteBtnHtml}
      </div>
      <section class="comments" style="margin-top:18px">
        <h3>Comments (${comments.length})</h3>
        <div id="single-review-comments"></div>
        <div style="margin-top:10px">
          <input id="single-review-comment-name" placeholder="Your name (optional)" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px">
          <textarea id="single-review-comment-text" rows="4" placeholder="Write a supportive comment..." style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;margin-top:8px"></textarea>
          <div style="margin-top:8px"><button id="single-review-comment-submit">Post Comment</button></div>
        </div>
      </section>`;

    renderCommentsFor('review_'+id, $('#single-review-comments'));

    const submit = $("#single-review-comment-submit");
    if (submit) submit.addEventListener("click", ()=>{
      const name = $("#single-review-comment-name").value.trim() || "Anonymous";
      const text = $("#single-review-comment-text").value.trim();
      if (!text) { alert("Enter a comment."); return; }
      const all = getAllComments();
      all['review_'+id] = all['review_'+id] || [];
      all['review_'+id].push({ name, text, time: new Date().toISOString() });
      saveAllComments(all);
      $("#single-review-comment-text").value = "";
      renderCommentsFor('review_'+id, $('#single-review-comments'));
      renderReviews();
    });

    const delBtn = $("#delete-single-review");
    if (delBtn) delBtn.addEventListener("click", ()=> deleteReview(id));
  }

  /* ---------------- Posting forms (feed + reviews) with alias/anon persistence ---------------- */
  const postForm = $("#post-form");
  if (postForm){
    postForm.addEventListener("submit", e=>{
      e.preventDefault();
      const providedNameInput = postForm.querySelector("#post-name");
      const regUser = getRegisteredUser();
      const current = getCurrentUser();

      let nameToUse = "";

      if (regUser && regUser.username) {
        const alias = getAliasForUser(regUser.username);
        if (!alias) {
          alert("Please choose a blog nickname (distinct from your account username) before posting.");
          openAliasModal({ forUser: regUser.username, required: false });
          return;
        }
        nameToUse = alias;
      } else {
        if (!getAnonName()) {
          const ok = ensureAnonExistsOrPrompt("posting");
          if (!ok) return;
        }
        nameToUse = getAnonName() || (providedNameInput?.value?.trim() || "Anonymous");
      }

      const text = (postForm.querySelector("#post-text")?.value||"").trim();
      if (!text){ alert("Please enter a message before posting."); return; }
      const fileInput = postForm.querySelector("#post-image");
      const newId = Date.now();
      const saveAndRedirect = (dataUrl) => {
        const posts = getPosts();
        posts.unshift({ id:newId, name: nameToUse || "Anonymous", text, imageDataUrl: dataUrl||"", time: new Date().toISOString() });
        savePosts(posts);
        postForm.reset();
        applyAliasToUI();
        window.location.href = `post.html?id=${newId}`;
      };
      if (fileInput && fileInput.files && fileInput.files[0]){
        const reader = new FileReader();
        reader.onload = ev => saveAndRedirect(ev.target.result);
        reader.readAsDataURL(fileInput.files[0]);
      } else saveAndRedirect("");
    });
  }

  const reviewForm = $("#review-form");
  if (reviewForm){
    reviewForm.addEventListener("submit", e=>{
      e.preventDefault();
      const providedNameInput = reviewForm.querySelector("#review-name");
      const regUser = getRegisteredUser();

      let nameToUse = "";
      if (regUser && regUser.username) {
        const alias = getAliasForUser(regUser.username);
        if (!alias) {
          // On Reviews page alias is REQUIRED => open required modal
          alert("You must choose a review nickname (distinct from your account username) before posting reviews.");
          openAliasModal({ forUser: regUser.username, required: true });
          return;
        }
        nameToUse = alias;
      } else {
        if (!getAnonName()) {
          // On Reviews page alias is REQUIRED => open required modal
          alert("You must choose an anonymous nickname before posting reviews.");
          openAliasModal({ isAnon:true, required: true });
          return;
        }
        nameToUse = getAnonName() || (providedNameInput?.value?.trim() || "Anonymous");
      }

      const text = (reviewForm.querySelector("#review-text")?.value||"").trim();
      if (!text){ alert("Please enter a review."); return; }
      const fileInput = reviewForm.querySelector("#review-image");
      const newId = Date.now();
      const saveAndRerender = (dataUrl) => {
        const reviews = getReviews();
        reviews.unshift({ id:newId, name: nameToUse || "Anonymous", text, imageDataUrl: dataUrl||"", time: new Date().toISOString() });
        saveReviews(reviews);
        reviewForm.reset();
        applyAliasToUI();
        document.querySelector('.reviews-grid')?.scrollIntoView({behavior:'smooth'});
      };
      if (fileInput && fileInput.files && fileInput.files[0]){
        const reader = new FileReader();
        reader.onload = ev => saveAndRerender(ev.target.result);
        reader.readAsDataURL(fileInput.files[0]);
      } else saveAndRerender("");
    });
  }

  /* ---------------- Registration & login (sets pu_current_user) ---------------- */
  const regForm = $("#registration-form");
  if (regForm){
    regForm.addEventListener("submit", e=>{
      e.preventDefault();
      const uname = (regForm.querySelector("#username")?.value||"").trim();
      const email = (regForm.querySelector("#email")?.value||"").trim();
      const pw = (regForm.querySelector("#password")?.value||"");
      const cpw = (regForm.querySelector("#confirm-password")?.value||"");
      const errors = [];
      if (uname.length < 3) errors.push("Username at least 3 chars.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Enter a valid email.");
      if (pw.length < 6) errors.push("Password at least 6 chars.");
      if (pw !== cpw) errors.push("Passwords must match.");
      if (errors.length){ alert(errors.join("\n")); return; }
      localStorage.setItem("pu_registered_user", JSON.stringify({ username: uname, email }));
      localStorage.setItem("pu_current_user", JSON.stringify({ username: uname }));
      alert("Registered — thanks! Redirecting to Blogs.");
      window.location.href = "FinalBlog.html";
    });
  }
  const loginForm = $("#login-form");
  if (loginForm){
    loginForm.addEventListener("submit", e=>{
      e.preventDefault();
      const entered = (loginForm.querySelector("#login-username")?.value||"").trim();
      const enteredPw = (loginForm.querySelector("#login-password")?.value||"");
      const registered = JSON.parse(localStorage.getItem("pu_registered_user")||"null");
      const demo = { username: "parentUser", password: "parentPass123" };
      const ok = (registered && entered === registered.username) || (entered === demo.username && enteredPw === demo.password);
      if (ok) {
        localStorage.setItem("pu_current_user", JSON.stringify({ username: entered }));
        alert("Login successful");
        if (window.location.pathname.includes("Subscribe_Page.html")) {
          updateSubscribePageUI();
        } else {
          window.location.href = "FinalBlog.html";
        }
      } else alert("Invalid username or password.");
    });
  }

  function getCurrentUser(){ try{ return JSON.parse(localStorage.getItem("pu_current_user") || "null"); }catch{return null;} }
  function getRegisteredUser(){ try{ return JSON.parse(localStorage.getItem("pu_registered_user")||"null"); }catch{return null;} }

  /* ---------------- Subscribe page UI update (unchanged behavior) ---------------- */
  function updateSubscribePageUI(){
    const current = getCurrentUser();
    const welcomeSection = $("#user-welcome");
    const regSection = $("#registration-section");
    const loginSection = $("#login-section");

    if (current && current.username) {
      if (welcomeSection) {
        $("#welcome-title").textContent = `Welcome, ${current.username}`;
        $("#welcome-sub").textContent = `Thanks for being part of Parents Unplugged — use the links below to manage your content.`;
        welcomeSection.style.display = "block";
      }
      if (regSection) regSection.style.display = "none";
      if (loginSection) loginSection.style.display = "none";

      const logoutBtn = $("#logout-btn");
      if (logoutBtn) {
        logoutBtn.onclick = () => {
          if (!confirm("Log out?")) return;
          localStorage.removeItem("pu_current_user");
          updateSubscribePageUI();
        };
      }

      const goBlogs = $("#go-to-blogs");
      if (goBlogs) goBlogs.href = "FinalBlog.html";
      const goReviews = $("#go-to-reviews");
      if (goReviews) goReviews.href = "Reviews.html";
    } else {
      if (welcomeSection) welcomeSection.style.display = "none";
      if (regSection) regSection.style.display = "block";
      if (loginSection) loginSection.style.display = "block";
    }
  }

  ensureAnonUIBindings();
  applyAliasToUI();

  showAliasIfNeededOnBlogPage();
  showAliasRequiredOnReviewsPage();

  renderPoll();
  renderAllPosts();
  renderReviews();
  renderSinglePost();
  renderSingleReview();
  updateSubscribePageUI();

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      ensureAnonUIBindings();
      renderUserBlogsGrid();
      updateSubscribePageUI();
      showAliasIfNeededOnBlogPage();
      showAliasRequiredOnReviewsPage();
    }
  });
});

