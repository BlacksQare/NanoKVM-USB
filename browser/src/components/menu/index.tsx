import { useCallback, useEffect, useRef, useState } from 'react';
import { Divider } from 'antd';
import clsx from 'clsx';
import { useAtomValue, useAtom } from 'jotai';
import { MousePointerClickIcon } from 'lucide-react';

import { serialStateAtom } from '@/jotai/device.ts';
import { mouseJigglerModeAtom, mouseLockModeAtom } from '@/jotai/mouse.ts';
import * as storage from '@/libs/storage';

import { Audio } from './audio';
import { Fullscreen } from './fullscreen';
import { Keyboard } from './keyboard';
import { Mouse } from './mouse';
import { Recorder } from './recorder';
import { SerialPort } from './serial-port';
import { Settings } from './settings';
import { Video } from './video';

export const Menu = () => {
  const serialState = useAtomValue(serialStateAtom);

  const [isMenuOpen, setIsMenuOpen] = useState(true);

  const nodeRef = useRef<HTMLDivElement | null>(null);

  const handleResize = useCallback(() => {
    if (!nodeRef.current) return;
  }, []);

  useEffect(() => {
    const isOpen = storage.getIsMenuOpen();
    setIsMenuOpen(isOpen);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  useEffect(() => {
    handleResize();
  }, [isMenuOpen, serialState, handleResize]);

  const [jigglerMode, setJigglerMode] = useAtom(mouseJigglerModeAtom);
  const [isMouseLock] = useAtom(mouseLockModeAtom);

  return ( 
    <>
      {!isMouseLock && (<div
        ref={nodeRef}
        className="fixed left-1/2 top-[10px] z-[1000] -translate-x-1/2 transition-opacity duration-300"
      >
        {/* Menubar */}
        <div className="sticky top-[10px] flex w-full justify-center">
          <div
            className={clsx(
              'h-[34px] items-center justify-between space-x-1.5 rounded bg-neutral-800/70 px-2',
              isMenuOpen ? 'flex' : 'hidden'
            )}
          >

            <Video />
            <Audio />

            {serialState === 'connected' && (
              <>
                <SerialPort />

                <Divider type="vertical" className="px-0.5" />

                <Keyboard />
                <Mouse />
              </>
            )}

            <Recorder />

            <Divider type="vertical" className="px-0.5" />
            <div className="flex h-[28px] w-[28px] cursor-pointer items-center justify-center rounded text-neutral-300 hover:bg-neutral-700/50 hover:text-white"
              onClick={() => setJigglerMode(jigglerMode === 'enable' ? 'disable' : 'enable')}
            >
              <MousePointerClickIcon size={16} 
                className={clsx('cursor-pointer', jigglerMode === 'enable' ? 'text-blue-500' : 'text-neutral-300')} 
              />
            </div>
            <Settings />
            <Fullscreen />
          </div>
        </div>
      </div>)}
      </>
  );
};