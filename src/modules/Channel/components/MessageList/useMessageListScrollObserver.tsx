import React, {MutableRefObject, useCallback, useEffect, useState} from 'react';

interface useMessageListScrollObserverProps {
  scrollRef?: MutableRefObject<HTMLDivElement>;
}

type useMessageListScrollObserverObject = [
  dragging: SendbirdScrollingInfo | null,
  updateScrollingInfo: (scrollingInfo: SendbirdScrollingInfo | null) => void,
]

export interface SendbirdScrollingInfo {
  id: string;
  direction: 'horizontal' | 'vertical' | null;
}

export const useMessageListScrollObserver = ({ scrollRef }: useMessageListScrollObserverProps): useMessageListScrollObserverObject => {
  // const carouselsRef = useRef(new Map());
  const containerNode = scrollRef?.current;

  const [dragging, setDragging] = useState<SendbirdScrollingInfo | null>(null);


  // useEffect(() => {
  //   const containerNode = scrollRef?.current;
  //   const carouselsMap = carouselsRef.current;
  //
  //   if (!containerNode) return;
  //
  //   const observer = new MutationObserver(mutationsList => {
  //     for (let mutation of mutationsList) {
  //       console.log('## mutationsList: ', mutationsList);
  //       if (mutation.type === 'attributes') {
  //         // Check if any ComponentB instance is actively dragging horizontally
  //         const isAnyDraggingHorizontally = Array.from(carouselsMap.values()).some(
  //           (carouselRef, index) => {
  //             console.log('## carouselRef.current: ', index, carouselRef.current);
  //             return carouselRef.current?.dragging === 'horizontal';
  //           }
  //         );
  //
  //         // Disable vertical scrolling if any ComponentB instance is dragging horizontally
  //         if (isAnyDraggingHorizontally) {
  //           containerNode.style.overflowY = 'hidden';
  //         } else {
  //           containerNode.style.overflowY = 'scroll';
  //         }
  //       }
  //     }
  //   });
  //   observer.observe(containerNode, { childList: true });
  //
  //   return () => {
  //     observer.disconnect();
  //   };
  // }, []);

  // useEffect(() => {
  //   const containerNode = scrollRef?.current;
  //
  //   if (!containerNode) return;
  //   console.log('## dragging: ', dragging);
  //   if (dragging && dragging.direction === 'horizontal' || dragging.direction === null ) {
  //     containerNode.style.overflowY = 'hidden';
  //   } else {
  //     containerNode.style.overflowY = 'scroll';
  //   }
  // }, [scrollRef?.current, dragging]);

  const updateScrollingInfo = (scrollingInfo: SendbirdScrollingInfo | null) => {
    if (!containerNode) return;

    // alert('## new scrollingInfo: ', scrollingInfo);
    if (scrollingInfo) {
      if (scrollingInfo.direction === 'horizontal') {
        containerNode.style.overflowY = 'hidden';
      }
    } else {
      containerNode.style.overflowY = 'scroll';
    }
    setDragging(scrollingInfo);
  }

  // const registerCarouselRef = (id: string, ref: React.MutableRefObject<HTMLDivElement>) => {
  //   const carouselsMap = carouselsRef.current;
  //   carouselsMap.set(id, ref);
  //   console.log('## registered: ', id, ref.current);
  // };
  //
  // const unregisterCarouselRef = (id: string) => {
  //   const carouselsMap = carouselsRef.current;
  //   carouselsMap.delete(id);
  // };

  return [
    dragging, updateScrollingInfo,
  ];
};



export default useMessageListScrollObserver;
