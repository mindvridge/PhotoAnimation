/**
 * Kling AI Client via PiAPI
 * https://piapi.ai - Image to Video API
 */

export interface KlingAnimationSettings {
  prompt: string;
  duration: 5 | 10;
  mode: 'standard' | 'pro';
  negativePrompt?: string;
}

export interface KlingTaskResponse {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  resultUrl?: string;
  error?: string;
}

export interface KlingGenerateResponse {
  code: number;
  message: string;
  data: {
    task_id: string;
  };
}

export interface KlingStatusResponse {
  code: number;
  message: string;
  data: {
    task_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    output?: {
      video_url: string;
    };
    error?: string;
  };
}

const PIAPI_BASE_URL = 'https://api.piapi.ai/api/kling/v1';

function getApiKey(): string {
  const apiKey = process.env.PIAPI_API_KEY;
  if (!apiKey) {
    throw new Error('PIAPI_API_KEY 환경 변수가 설정되지 않았습니다.');
  }
  return apiKey;
}

/**
 * Kling AI Image-to-Video 애니메이션 생성 요청
 */
export async function generateAnimation(
  imageUrl: string,
  settings: KlingAnimationSettings
): Promise<KlingTaskResponse> {
  const apiKey = getApiKey();

  try {
    const response = await fetch(`${PIAPI_BASE_URL}/image2video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        image_url: imageUrl,
        prompt: settings.prompt,
        negative_prompt: settings.negativePrompt || 'blurry, distorted, low quality',
        duration: settings.duration,
        mode: settings.mode,
        // 추가 옵션
        cfg_scale: 0.5, // 프롬프트 준수도
        aspect_ratio: '1:1', // 정사각형 유지
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Kling AI API error:', errorText);
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const result: KlingGenerateResponse = await response.json();

    if (result.code !== 0 && result.code !== 200) {
      throw new Error(result.message || '알 수 없는 오류가 발생했습니다.');
    }

    return {
      taskId: result.data.task_id,
      status: 'pending',
    };
  } catch (error) {
    console.error('Generate animation error:', error);
    return {
      taskId: '',
      status: 'failed',
      error: error instanceof Error ? error.message : '애니메이션 생성 요청에 실패했습니다.',
    };
  }
}

/**
 * 애니메이션 생성 상태 확인
 */
export async function checkStatus(taskId: string): Promise<KlingTaskResponse> {
  const apiKey = getApiKey();

  try {
    const response = await fetch(`${PIAPI_BASE_URL}/task/${taskId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Kling AI status check error:', errorText);
      throw new Error(`상태 확인 실패: ${response.status}`);
    }

    const result: KlingStatusResponse = await response.json();

    if (result.code !== 0 && result.code !== 200) {
      throw new Error(result.message || '상태 확인에 실패했습니다.');
    }

    return {
      taskId: result.data.task_id,
      status: result.data.status,
      progress: result.data.progress,
      resultUrl: result.data.output?.video_url,
      error: result.data.error,
    };
  } catch (error) {
    console.error('Check status error:', error);
    return {
      taskId,
      status: 'failed',
      error: error instanceof Error ? error.message : '상태 확인에 실패했습니다.',
    };
  }
}

/**
 * 완료된 애니메이션 결과 가져오기
 */
export async function getResult(taskId: string): Promise<KlingTaskResponse> {
  // checkStatus와 동일하지만 완료 여부를 확인
  const status = await checkStatus(taskId);

  if (status.status === 'completed' && status.resultUrl) {
    return status;
  }

  if (status.status === 'failed') {
    return status;
  }

  return {
    taskId,
    status: status.status,
    progress: status.progress,
    error: '아직 처리 중입니다.',
  };
}

/**
 * 애니메이션 프리셋 정의
 */
export const ANIMATION_PRESETS = {
  smile: {
    id: 'smile',
    name: '미소짓기',
    prompt: 'gentle warm smile, natural happy expression, subtle facial movement',
    icon: '😊',
  },
  nod: {
    id: 'nod',
    name: '고개끄덕임',
    prompt: 'subtle head nod, agreeing gesture, natural neck movement',
    icon: '👋',
  },
  blink: {
    id: 'blink',
    name: '눈깜빡임',
    prompt: 'natural eye blink, soft gentle gaze, subtle eyelid movement',
    icon: '😌',
  },
  wave: {
    id: 'wave',
    name: '손흔들기',
    prompt: 'gentle hand wave, friendly greeting gesture, natural arm movement',
    icon: '🤚',
  },
  turn: {
    id: 'turn',
    name: '고개돌리기',
    prompt: 'slight head turn to the side, gentle rotation, natural movement',
    icon: '↩️',
  },
  talk: {
    id: 'talk',
    name: '말하기',
    prompt: 'natural talking motion, subtle lip movement, expressive face',
    icon: '💬',
  },
} as const;

export type AnimationPresetId = keyof typeof ANIMATION_PRESETS;

/**
 * 크레딧 비용 계산
 */
export function calculateCreditCost(
  photoCount: number,
  duration: 5 | 10,
  mode: 'standard' | 'pro'
): number {
  const baseCost = mode === 'pro' ? 2 : 1;
  const durationMultiplier = duration === 10 ? 1.5 : 1;
  return Math.ceil(photoCount * baseCost * durationMultiplier);
}
