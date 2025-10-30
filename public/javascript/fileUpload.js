const dropZone = document.querySelector(".drop-zone");
const fileInput = document.querySelector("#fileInput");
const browseBtn = document.querySelector("#browseBtn");

const bgProgress = document.querySelector(".bg-progress");
const progressPercent = document.querySelector("#progressPercent");
const progressContainer = document.querySelector(".progress-container");
const progressBar = document.querySelector(".progress-bar");
const status = document.querySelector(".status");

const sharingContainer = document.querySelector(".sharing-container");
const copyURLBtn = document.querySelector("#copyURLBtn");
const fileURL = document.querySelector("#fileURL");
const emailForm = document.querySelector("#emailForm");
// Find the send button reliably instead of using numeric indexing (which broke when we added a checkbox)
const emailSendBtn = emailForm ? emailForm.querySelector('button[type="submit"]') : null;

const toast = document.querySelector(".toast");

// Use relative endpoints so the script works both locally and in production
const uploadURL = "/api/files";
const emailURL = "/api/files/send";

// Serverless functions on Vercel have a small body size limit. Use a lower
// client-side limit in production on vercel.app to avoid 413 responses.
const isVercel = typeof window !== 'undefined' && /vercel\.app$/i.test(window.location.hostname);
const maxAllowedSize = isVercel ? (4 * 1024 * 1024) : (100 * 1024 * 1024);


browseBtn.addEventListener("click", () => {
  fileInput.click();
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  //   console.log("dropped", e.dataTransfer.files[0].name);
  const files = e.dataTransfer.files;
  if (files.length === 1) {
    if (files[0].size < maxAllowedSize) {
      fileInput.files = files;
      uploadFile();
    } else {
      showToast("Max file size is 100MB");
    }
  } else if (files.length > 1) {
    showToast("You can't upload multiple files");
  }
  dropZone.classList.remove("dragged");
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragged");

  // console.log("dropping file");
});

dropZone.addEventListener("dragleave", (e) => {
  dropZone.classList.remove("dragged");

  console.log("drag ended");
});

// file input change and uploader
fileInput.addEventListener("change", () => {
  if (fileInput.files[0].size > maxAllowedSize) {
    showToast("Max file size is 100MB");
    fileInput.value = ""; // reset the input
    return;
  }
  uploadFile();
});

// sharing container listenrs
if (copyURLBtn) {
  copyURLBtn.addEventListener("click", () => {
    fileURL.select();
    document.execCommand("copy");
    showToast("Copied to clipboard");
  });

  // make keyboard activation work (Enter / Space)
  copyURLBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      copyURLBtn.click();
    }
  });
}

fileURL.addEventListener("click", () => {
  fileURL.select();
});

const uploadFile = () => {
  console.log("file added uploading");

  files = fileInput.files;
  const formData = new FormData();
  // Must use the same field name as multer.single('file') on the server
  formData.append("file", files[0]);

  //show the uploader
  progressContainer.style.display = "block";

  // upload file
  const xhr = new XMLHttpRequest();
  xhr.responseType = 'text';

  // listen for upload progress
  xhr.upload.onprogress = function (event) {
    // find the percentage of uploaded
    let percent = Math.round((100 * event.loaded) / event.total);
    progressPercent.innerText = percent;
    const scaleX = `scaleX(${percent / 100})`;
    bgProgress.style.transform = scaleX;
    progressBar.style.transform = scaleX;
  };

  // handle error
  xhr.upload.onerror = function () {
    showToast(`Error in upload: ${xhr.status}.`);
    fileInput.value = ""; // reset the input
  };

  // listen for response which will give the link
  xhr.onreadystatechange = function () {
    if (xhr.readyState == XMLHttpRequest.DONE) {
      const contentType = xhr.getResponseHeader('content-type') || '';
      const responseText = xhr.responseText || '';
      if (xhr.status >= 400) {
        // Show server-provided message when available
        let message = `Upload failed (${xhr.status})`;
        if (contentType.includes('application/json')) {
          try {
            const parsed = JSON.parse(responseText);
            if (parsed && (parsed.error || parsed.message)) {
              message = parsed.error || parsed.message;
            }
          } catch(_) {}
        } else if (/Request Entity Too Large/i.test(responseText)) {
          message = 'File too large for serverless upload. Try a smaller file.';
        }
        showToast(message);
        fileInput.value = '';
        progressContainer.style.display = 'none';
        return;
      }
      onFileUploadSuccess(responseText, contentType);
    }
  };

  xhr.open("POST", uploadURL);
  xhr.send(formData);
};

const onFileUploadSuccess = (res, contentType = '') => {
  console.log('Upload response:', res);
  
  try {
    fileInput.value = ""; // reset the input
    status.innerText = "Uploaded";

    // remove the disabled attribute from form btn & make text send
    if (emailSendBtn) {
      emailSendBtn.removeAttribute("disabled");
      emailSendBtn.innerText = "Send";
    }
    progressContainer.style.display = "none"; // hide the box

    const parsed = contentType.includes('application/json')
      ? JSON.parse(res)
      : (res && res.trim().startsWith('{') ? JSON.parse(res) : null);
    if (!parsed) {
      showToast('Unexpected response from server');
      return;
    }
    console.log('Parsed response:', parsed);
    
    if (!parsed.file) {
      const serverMessage = parsed.error || parsed.message;
      console.error('No file URL in response', parsed);
      showToast('Upload failed' + (serverMessage ? ' - ' + serverMessage : ' - no download link'));
      return;
    }

    const { file: url } = parsed;
    console.log('File URL:', url);
    
    if (sharingContainer) {
      sharingContainer.style.display = "block";
      if (fileURL) {
        fileURL.value = url;
      } else {
        console.error('fileURL element not found');
      }
    } else {
      console.error('sharingContainer element not found');
    }
  } catch (err) {
    console.error('Error processing upload response:', err);
    showToast('Upload failed - ' + err.message);
  }
};

emailForm.addEventListener("submit", (e) => {
  e.preventDefault(); // stop submission

  // disable the button
  if (emailSendBtn) {
    emailSendBtn.setAttribute("disabled", "true");
    emailSendBtn.innerText = "Sending";
  }

  const url = fileURL.value;

  const formData = {
    uuid: url.split("/").splice(-1, 1)[0],
    emailTo: emailForm.elements["to-email"].value,
    emailFrom: emailForm.elements["from-email"].value,
  };
  console.log(formData);
  fetch(emailURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        showToast("Email Sent");
        sharingContainer.style.display = "none"; // hide the box
      }
    });
});

let toastTimer;
// the toast function
const showToast = (msg) => {
  clearTimeout(toastTimer);
  toast.innerText = msg;
  toast.classList.add("show");
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
};

console.log('fileUpload.js loaded');
// (Autofill removed — receiver must be entered manually)


