import React from "react";
import { PlusCircle, Calendar as CalendarIcon } from "lucide-react";
import { useAppContext } from "../store/AppContext";
import { cn, safeFormat as format } from "../lib/utils";

export const CreateTaskModal = ({ onClose }: { onClose: () => void }) => {
  const { addTask } = useAppContext();
  const [date, setDate] = React.useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = React.useState("10:00");
  const [platform, setPlatform] = React.useState<any>("Instagram");
  const [title, setTitle] = React.useState("");
  const [instructions, setInstructions] = React.useState("");
  const [videoUrl, setVideoUrl] = React.useState("");
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTask({ date, time, platform, title, instructions, videoUrl });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
          <h2 className="text-xl border-none font-semibold text-gray-900">New Task</h2>
          <button onClick={onClose} className="p-2 -mr-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 transition-colors">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-5">
          <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
              <select
                required
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                required
                placeholder="e.g., Summer Campaign Post"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
              <textarea
                required
                rows={4}
                placeholder="What exactly should the collaborator do?"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attached Video (Required)</label>
              
              {isUploading ? (
                <div className="mt-1 flex flex-col justify-center px-6 pt-5 pb-6 border-2 border-gray-200 rounded-xl bg-gray-50">
                  <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                    <span>Uploading video...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              ) : !videoUrl ? (
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none px-1">
                        <span>Upload a video</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept="video/*"
                          className="sr-only"
                          onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              
                              if (file.size > 50 * 1024 * 1024) {
                                alert("File size must be exactly or less than 50MB");
                                return;
                              }

                              setIsUploading(true);
                              setUploadProgress(10);
                              
                              try {
                                const formData = new FormData();
                                formData.append("file", file);
                                formData.append("upload_preset", "sfz2efyw");

                                const xhr = new XMLHttpRequest();
                                xhr.open("POST", "https://api.cloudinary.com/v1_1/daxpgmju9/video/upload", true);

                                xhr.upload.onprogress = (e) => {
                                  if (e.lengthComputable) {
                                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                                    setUploadProgress(percentComplete);
                                  }
                                };

                                xhr.onload = () => {
                                  if (xhr.status === 200) {
                                    const data = JSON.parse(xhr.responseText);
                                    setVideoUrl(data.secure_url);
                                    setUploadProgress(100);
                                    setIsUploading(false);
                                  } else {
                                    const errorData = JSON.parse(xhr.responseText);
                                    console.error("Upload error:", errorData);
                                    alert("Failed to upload video to Cloudinary. Error: " + (errorData.error?.message || "Upload failed"));
                                    setIsUploading(false);
                                  }
                                };

                                xhr.onerror = () => {
                                  console.error("Upload error");
                                  alert("Failed to upload video to Cloudinary. Network error.");
                                  setIsUploading(false);
                                };

                                xhr.send(formData);
                              } catch (err: any) {
                                console.error("Upload error:", err);
                                alert("Failed to upload video to Cloudinary. Error: " + err.message);
                                setIsUploading(false);
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">MP4, WebM up to 50MB</p>
                  </div>
                </div>
              ) : (
                <div className="mt-1 relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <video src={videoUrl} controls className="w-full h-32 object-cover" />
                  <button
                    type="button"
                    onClick={() => setVideoUrl("")}
                    className="absolute top-2 right-2 p-1 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="task-form"
            disabled={!title || !instructions || !videoUrl || isUploading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
};
