import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { StepsList } from '../components/StepsList';
import { FileExplorer } from '../components/FileExplorer';
import { TabView } from '../components/TabView';
import { CodeEditor } from '../components/CodeEditor';
import { PreviewFrame } from '../components/PreviewFrame';
import { Step, FileItem, StepType } from '../types';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { parseXml } from '../steps';
import { useWebContainer } from '../hooks/useWebContainer';
import { Loader } from '../components/Loader';

// Type for chat messages
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function Builder() {
  const location = useLocation();
  const { prompt } = location.state as { prompt: string };
  const [userPrompt, setPrompt] = useState<string>('');
  const [llmMessages, setLlmMessages] = useState<ChatMessage[]>([]);
  const [userMessages, setUserMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [templateSet, setTemplateSet] = useState<boolean>(false);
  const webcontainer = useWebContainer();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;

    steps
      .filter(({ status }) => status === 'pending')
      .map((step) => {
        updateHappened = true;
        if (step?.type === StepType.CreateFile) {
          let parsedPath = step.path?.split('/') ?? [];
          let currentFileStructure = [...originalFiles];
          let finalAnswerRef = currentFileStructure;

          let currentFolder = '';
          while (parsedPath.length) {
            currentFolder = `${currentFolder}/${parsedPath[0]}`;
            let currentFolderName = parsedPath[0];
            parsedPath = parsedPath.slice(1);

            if (!parsedPath.length) {
              let file = currentFileStructure.find((x) => x.path === currentFolder);
              if (!file) {
                currentFileStructure.push({
                  name: currentFolderName,
                  type: 'file',
                  path: currentFolder,
                  content: step.code,
                });
              } else {
                file.content = step.code;
              }
            } else {
              let folder = currentFileStructure.find((x) => x.path === currentFolder);
              if (!folder) {
                currentFileStructure.push({
                  name: currentFolderName,
                  type: 'folder',
                  path: currentFolder,
                  children: [],
                });
              }

              currentFileStructure = currentFileStructure.find((x) => x.path === currentFolder)!.children!;
            }
          }
          originalFiles = finalAnswerRef;
        }
      });

    if (updateHappened) {
      setFiles(originalFiles);
      setSteps((steps) =>
        steps.map((s: Step) => ({
          ...s,
          status: 'completed',
        }))
      );
    }
  }, [steps, files]);

  useEffect(() => {
    const createMountStructure = (files: FileItem[]): Record<string, any> => {
      const mountStructure: Record<string, any> = {};

      const processFile = (file: FileItem, isRootFolder: boolean): any => {
        if (file.type === 'folder') {
          mountStructure[file.name] = {
            directory: file.children
              ? Object.fromEntries(file.children.map((child) => [child.name, processFile(child, false)]))
              : {},
          };
        } else if (file.type === 'file') {
          if (isRootFolder) {
            mountStructure[file.name] = {
              file: {
                contents: file.content || '',
              },
            };
          } else {
            return {
              file: {
                contents: file.content || '',
              },
            };
          }
        }

        return mountStructure[file.name];
      };

      files.forEach((file) => processFile(file, true));
      return mountStructure;
    };

    const mountStructure = createMountStructure(files);
    webcontainer?.mount(mountStructure);
  }, [files, webcontainer]);

  async function init() {
    const response = await axios.post(`${BACKEND_URL}/template`, {
      prompt: prompt.trim(),
    });
    setTemplateSet(true);

    const { prompts, uiPrompts } = response.data;

    setSteps(
      parseXml(uiPrompts[0]).map((x: Step) => ({
        ...x,
        status: 'pending',
      }))
    );

    setLoading(true);
    const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
      messages: [...prompts, prompt].map((content) => ({
        role: 'user',
        content,
      })),
    });
    setLoading(false);

    // Only add the initial prompt to visible messages
    setUserMessages([prompt]);

    setSteps((s) => [
      ...s,
      ...parseXml(stepsResponse.data.response).map((x) => ({
        ...x,
        status: 'pending' as 'pending',
      })),
    ]);

    // Keep full conversation history for the backend
    setLlmMessages([
      ...prompts,
      prompt,
    ].map((content) => ({
      role: 'user',
      content,
    })));

    setLlmMessages((x) => [...x, { role: 'assistant', content: stepsResponse.data.response }]);
  }

  useEffect(() => {
    init();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-100">Website Builder</h1>
        <p className="text-sm text-gray-400 mt-1">Prompt: {prompt}</p>
      </header>

      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-4 gap-6 p-6">
          <div className="col-span-1 space-y-6 overflow-auto">
            <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-lg">
              {/* Modified Chat Area to only show user-typed messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[75vh]">
                {llmMessages.map((message, index) => {
                  // Only show messages that exist in userMessages array
                  if (message.role === 'user' && !userMessages.includes(message.content)) {
                    return null;
                  }
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-purple-500 text-white self-end'
                          : 'bg-gray-700 text-gray-300 self-start'
                      }`}
                      style={{
                        maxWidth: '75%',
                        alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {message.role==='user'?message.content:'code has been generated'}
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex justify-center">
                    <Loader />
                  </div>
                )}
              </div>

              <div className="flex items-center border-t border-gray-700 p-3">
                <textarea
                  value={userPrompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-900 text-gray-300 border border-gray-700 rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring focus:ring-purple-400"
                  rows={1}
                ></textarea>
                <button
                  onClick={async () => {
                    if (!userPrompt.trim()) return;
                    
                    const newMessage: ChatMessage = { role: 'user', content: userPrompt };

                    // Add to visible user messages
                    setUserMessages(prev => [...prev, userPrompt]);

                    setLoading(true);
                    const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
                      messages: [...llmMessages, newMessage],
                    });
                    setLoading(false);

                    setLlmMessages((x) => [
                      ...x,
                      newMessage,
                      { role: 'assistant', content: stepsResponse.data.response },
                    ]);

                    setSteps((s) => [
                      ...s,
                      ...parseXml(stepsResponse.data.response).map((x) => ({
                        ...x,
                        status: 'pending' as 'pending',
                      })),
                    ]);

                    setPrompt('');
                  }}
                  disabled={loading}
                  className={`${
                    loading ? 'bg-purple-400' : 'bg-purple-500 hover:bg-purple-600'
                  } text-white rounded-lg ml-3 px-4 py-2 flex-shrink-0`}
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-1">
            <FileExplorer files={files} onFileSelect={setSelectedFile} />
          </div>

          <div className="col-span-2 bg-gray-900 rounded-lg shadow-lg p-4 h-[calc(100vh-8rem)]">
            <TabView activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="h-[calc(100%-4rem)]">
              {activeTab === 'code' ? (
                <CodeEditor file={selectedFile} />
              ) : (
                <PreviewFrame webContainer={webcontainer} files={files} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}