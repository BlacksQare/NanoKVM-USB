import { CSSProperties, useEffect, useMemo, useState } from 'react';
import { Alert, Result, Spin } from 'antd';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'react-responsive';

import { DeviceModal } from '@/components/device-modal';
import { Keyboard } from '@/components/keyboard';
import { Menu } from '@/components/menu';
import { Mouse } from '@/components/mouse';
import { VirtualKeyboard } from '@/components/virtual-keyboard';
import {
  resolutionAtom,
  serialStateAtom,
  videoRotationAtom,
  videoScaleAtom,
  videoStateAtom
} from '@/jotai/device.ts';
import { isKeyboardEnableAtom } from '@/jotai/keyboard.ts';
import { device } from '@/libs/device';
import { camera } from '@/libs/media/camera';
import { checkPermission, requestCameraPermission } from '@/libs/media/permission.ts';
import * as storage from '@/libs/storage';
import type { Resolution } from '@/types.ts';

const App = () => {
  const { t } = useTranslation();
  const isBigScreen = useMediaQuery({ minWidth: 850 });

  const videoState = useAtomValue(videoStateAtom);
  const serialState = useAtomValue(serialStateAtom);
  const isKeyboardEnable = useAtomValue(isKeyboardEnableAtom);
  const setResolution = useSetAtom(resolutionAtom);
  const [videoRotation, setVideoRotation] = useAtom(videoRotationAtom);
  const [videoScale, setVideoScale] = useAtom(videoScaleAtom);

  const [isLoading, setIsLoading] = useState(true);
  const [isCameraGranted, setIsCameraGranted] = useState(false);
  const [shouldSwapDimensions, setShouldSwapDimensions] = useState(false);

  useEffect(() => {
    initResolution();
    initScale();
    initRotation();

    return () => {
      camera.close();
      device.serialPort.close();
    };
  }, []);

  useEffect(() => {
    setShouldSwapDimensions(videoRotation === 90 || videoRotation === 270);
  }, [videoRotation]);

  const videoStyle = useMemo(() => {
    const baseStyle = {
      transformOrigin: 'center',
      maxWidth: shouldSwapDimensions ? '100vh' : '100%',
      maxHeight: shouldSwapDimensions ? '100vw' : '100%'
    };

    if (videoScale === -1) {
      return {
        ...baseStyle,
        width: '100%',
        maxHeight: undefined,
        maxWidth: undefined
      };
    }

    if (videoScale === 0) {
      return {
        ...baseStyle,
        width: shouldSwapDimensions ? '100vh' : '100%',
        height: shouldSwapDimensions ? '100vw' : '100%',
        objectFit: 'contain',
        transform: `rotate(${videoRotation}deg)`
      };
    }

    return {
      ...baseStyle,
      objectFit: 'scale-down',
      transform: `scale(${videoScale}) rotate(${videoRotation}deg)`
    };
  }, [videoScale, videoRotation, shouldSwapDimensions]);

  function initResolution() {
    const resolution = storage.getVideoResolution();
    if (resolution) {
      setResolution(resolution);
    }

    requestPermission(resolution);
  }

  function initScale() {
    const scale = storage.getVideoScale();
    if (scale) {
      setVideoScale(scale);
      return;
    }
    setVideoScale(0);
  }

  function initRotation() {
    const rotation = storage.getVideoRotation();
    if (rotation) {
      setVideoRotation(rotation);
    }
  }

  async function requestPermission(resolution?: Resolution) {
    try {
      const isGranted = await checkPermission('camera');
      if (isGranted) {
        setIsCameraGranted(true);
        return;
      }

      const isSuccess = await requestCameraPermission(resolution);
      setIsCameraGranted(isSuccess);
    } catch (err: any) {
      console.log('failed to request media permissions: ', err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <Spin size="large" spinning={isLoading} tip={t('camera.tip')} fullscreen />;
  }

  if (!isCameraGranted) {
    return (
      <Result
        status="info"
        title={t('camera.denied')}
        extra={[<h2 className="text-xl text-white">{t('camera.authorize')}</h2>]}
      />
    );
  }

  return (
    <>
      <DeviceModal />

      {videoState === 'connected' && (
        <>
          <Menu />

          {serialState === 'notSupported' && (
            <Alert message={t('serial.notSupported')} type="warning" banner closable />
          )}

          {serialState === 'connected' && (
            <>
              <Mouse />
              {isKeyboardEnable && <Keyboard />}
            </>
          )}
        </>
      )}
      <video
        id="video"
        style={videoStyle as CSSProperties}
        // muted
        autoPlay
        playsInline
      />

      <VirtualKeyboard isBigScreen={isBigScreen} />
    </>
  );
};

export default App;
