import { buildUrl } from "build-url-ts"

const API_URL = 'http://127.0.0.1:5000';

export const openFile = async (type?: string) => {
    const url = buildUrl(API_URL, {
        path: 'files/open',
        queryParams: {
            type
        }
    });

    const response = await fetch(url);
    const path = await response.json();

    return path;
}

export const saveFile = async (type?: string) => {
    const url = buildUrl(API_URL, {
        path: 'files/save',
        queryParams: {
            type
        }
    });

    const response = await fetch(url);
    const path = await response.json();

    return path;
}


export const createNotebook = async (name?: string, path?: string): Promise<string> => {
    const url = buildUrl(API_URL, {
        path: 'notebooks/create',
        queryParams: {
            name,
            path
        }
    });

    const response = await fetch(url);
    const id = await response.json();

    return id;
}

export const renameNotebook = async (notebookId: string, name: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/rename`,
        queryParams: {
            name
        }
    });

    const response = await fetch(url);
    const notebook = await response.json();

    return notebook;
}

export const getNotebook = async (notebookId: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}`,
    });

    const response = await fetch(url);
    const notebook = await response.json();

    return notebook;
}

export const saveNotebook = async (notebookId: string, content: object, path?: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/save`,
        queryParams: {
            path
        }
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(content),
    });
    const jobId = await response.json();

    return jobId;
}

export const loadNotebook = async (path?: string) => {
    const url = buildUrl(API_URL, {
        path: 'notebooks/load',
        queryParams: {
            path
        }
    });

    const response = await fetch(url);
    const jobId = await response.json();

    return jobId;
}

export const notebookRun = async (notebookId: string, content: string, prompt: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/run`,
        queryParams: {
            prompt
        }
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(content),
    });
    const jobId = await response.json();

    return jobId;
}

export const notebookGenerate = async (notebookId: string, content: string, prompt: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/generate`,
        queryParams: {
            prompt
        }
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(content),
    });
    const jobId = await response.json();

    return jobId;
}

export const notebookEdit = async (notebookId: string, content: string, text: string, prompt: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/edit`,
        queryParams: {
            text,
            prompt
        }
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(content),
    });
    const jobId = await response.json();

    return jobId;
}

export const notebookChat = async (notebookId: string, prompt: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/chat`,
        queryParams: {
            prompt
        }
    });

    const response = await fetch(url);
    const jobId = await response.json();

    return jobId;
}

export const getIdeas = async (notebookId: string, content: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/ideas`,
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(content),
    });
    const jobId = await response.json();

    return jobId;
}

export const addSource = async (notebookId: string, type: string, origin: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/sources/add`,
        queryParams: {
            type,
            origin
        }
    });

    const response = await fetch(url);
    const jobId = await response.json();

    return jobId;
}

export const getSource = async (notebookId: string, sourceId: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/sources/${sourceId}`,
    });

    const response = await fetch(url);
    const source = await response.json();

    return source;
}

export const getSourceSummary = async (notebookId: string, sourceId: string, lastK?: number) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/sources/${sourceId}/summary`,
        queryParams: {
            last_K: lastK
        }
    });

    const response = await fetch(url);
    const jobId = await response.json();

    return jobId;
}

export const startLiveSource = async (notebookId: string, type: string, origin: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/live_sources/start`,
        queryParams: {
            type,
            origin
        }
    });

    const response = await fetch(url);
    const status = await response.json();

    return status;
}

export const getRunningLiveSources = async (notebookId: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/live_sources/running`,
    });

    const response = await fetch(url);
    const sources = await response.json();

    return sources;
}

export const getLiveSource = async (notebookId: string, sourceId: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/live_sources/${sourceId}`,
    });

    const response = await fetch(url);
    const source = await response.json();

    return source;
}

export const getLiveSourceSummary = async (notebookId: string, sourceId: string, lastK?: number) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/live_sources/${sourceId}/summary`,
        queryParams: {
            last_K: lastK
        }
    });

    const response = await fetch(url);
    const jobId = await response.json();

    return jobId;
}

export const stopLiveSource = async (notebookId: string, sourceId: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/live_sources/${sourceId}/stop`,
    });

    const response = await fetch(url);
    const status = await response.json();

    return status;
}

export const getDocument = async (notebookId: string, documentId: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/documents/${documentId}`,
    });

    const response = await fetch(url);
    const document = await response.json();

    return document;
}

export const getJob = async (jobId: string) => {
    const url = buildUrl(API_URL, {
        path: `jobs/${jobId}`,
    });

    const response = await fetch(url);
    const job = await response.json();

    return job;
}

const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time));


export const joinJob = async (jobId: string, onProgressCallback: Function, timeout: number = 250) => {
    let job = await getJob(jobId);

    while (job.status === 'running') {
        onProgressCallback(job);
        await sleep(timeout);
        job = await getJob(jobId);
    }

    return job.output;
}