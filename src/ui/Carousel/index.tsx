import './index.scss';
import React, {ReactElement, useRef, useState} from 'react';
import { useMediaQueryContext } from '../../lib/MediaQueryContext';

const PADDING_WIDTH = 24;
const CONTENT_LEFT_WIDTH = 40;
const SWIPE_THRESHOLD = 30;
const LAST_ITEM_RIGHT_SNAP_THRESHOLD = 100;

interface ItemPosition {
  start: number;
  end: number;
}

interface CarouselItemProps {
  key: string;
  item: ReactElement;
  defaultWidth: string;
}

/**
 * fixed sized template items should use its child width.
 * Whereas flex sized template items should use its parent's width.
 * @param item
 */
function shouldRenderAsFixed(item: ReactElement) {
  return item.props.templateItems[0].width?.type === 'fixed';
}

function CarouselItem({
  key,
  item,
  defaultWidth,
}: CarouselItemProps): ReactElement {
  return <div key={key} style={shouldRenderAsFixed(item) ? { width: 'fit-content' } : { minWidth: defaultWidth }}>
    {item}
  </div>;
}

interface CarouselProps {
  id: string;
  items: ReactElement[];
  gap?: number;
  classNameToHideOverflowY?: string;
}

interface StartPos {
  x: number;
  y: number;
}

interface DraggingInfo {
  dragging: 'vertical' | 'horizontal' | null;
  startPos: StartPos | null;
  offset: number;
}

export function Carousel({
  id,
  items,
  gap = 8,
  classNameToHideOverflowY = 'sendbird-conversation__messages-padding',
}: CarouselProps): ReactElement {
  const { isMobile } = useMediaQueryContext();
  const carouselRef = useRef<HTMLDivElement>(null);
  const screenWidth = window.innerWidth;
  const defaultItemWidth = carouselRef.current?.clientWidth ?? 0;
  const itemWidths = items.map((item) => {
    if (shouldRenderAsFixed(item)) {
      return item.props.templateItems[0].width?.value;
    }
    return defaultItemWidth;
  });
  const allItemsWidth = itemWidths.reduce((prev, curr) => prev + gap + curr);
  const lastItemWidth = itemWidths[itemWidths.length - 1];
  const isLastItemNarrow = lastItemWidth <= LAST_ITEM_RIGHT_SNAP_THRESHOLD;
  const isLastTwoItemsFitScreen = getIsLastTwoItemsFitScreen();
  const itemPositions: ItemPosition[] = getEachItemPositions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draggingInfo, setDraggingInfo] = useState<DraggingInfo | null>(null);
  const [translateX, setTranslateX] = useState(0);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDraggingInfo({
      dragging: 'horizontal',
      startPos: {
        x: event.clientX,
        y: event.clientY,
      },
      offset: 0,
    });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingInfo) return;
    const currentX = event.clientX;
    const newOffset = currentX - draggingInfo.startPos.x;
    setDraggingInfo({
      ...draggingInfo,
      offset: newOffset,
    });
  };

  const handleMouseUp = () => {
    if (!draggingInfo) return;
    onDragEnd();
    setDraggingInfo(null);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setDraggingInfo({
      dragging: null,
      startPos: {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      },
      offset: 0,
    });
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!draggingInfo?.startPos) return;

    const startPos = draggingInfo.startPos;
    const touchMoveX = event.touches[0].clientX;
    const touchMoveY = event.touches[0].clientY;
    const deltaX = Math.abs(touchMoveX - startPos.x);
    const deltaY = Math.abs(touchMoveY - startPos.y);
    const newOffset = event.touches[0].clientX - startPos.x;
    if (newOffset === draggingInfo.offset) return;

    if (!draggingInfo.dragging) {
      if (deltaX > deltaY) {
        const parentElement = document.getElementsByClassName(classNameToHideOverflowY);
        (parentElement[0] as HTMLElement).style.overflowY = 'hidden';
        setDraggingInfo({
          ...draggingInfo,
          dragging: 'horizontal',
          offset: newOffset,
        });
      } else {
        setDraggingInfo({
          ...draggingInfo,
          dragging: 'vertical',
        });
      }
    } else if (draggingInfo.dragging === 'horizontal') {
      setDraggingInfo({
        ...draggingInfo,
        offset: newOffset,
      });
    }
  };

  const handleTouchEnd = () => {
    if (draggingInfo !== null) {
      onDragEnd();
      setDraggingInfo(null);
    }
  };

  const handleDragEnd = () => {
    const offset = draggingInfo.offset;
    const absOffset = Math.abs(offset);
    if (absOffset >= SWIPE_THRESHOLD) {
      // If dragged to left, next index should be to the right
      if (offset < 0 && currentIndex < items.length - 1) {
        const nextIndex = currentIndex + 1;
        setTranslateX(itemPositions[nextIndex].start);
        setCurrentIndex(nextIndex);
      // If dragged to right, next index should be to the left
      } else if (offset > 0 && currentIndex > 0) {
        const nextIndex = currentIndex - 1;
        setTranslateX(itemPositions[nextIndex].start);
        setCurrentIndex(nextIndex);
      }
    }
  };

  const handleDragEndForMobile = () => {
    const offset = draggingInfo.offset;
    const absOffset = Math.abs(offset);
    if (absOffset >= SWIPE_THRESHOLD) {
      // If dragged to left, next index should be to the right
      if (offset < 0 && currentIndex < items.length - 1) {
        const nextIndex = currentIndex + 1;
        /**
         * This is special logic for "더 보기" button for Socar use-case.
         * The button will have a small width (less than 50px).
         * We want to include this button in the view and snap to right padding wall IFF !isLastTwoItemsFitScreen.
         */
        if (isLastItemNarrow) {
          if (isLastTwoItemsFitScreen) {
            if (nextIndex !== items.length - 1) {
              setTranslateX(itemPositions[nextIndex].start);
              setCurrentIndex(nextIndex);
            }
          } else if (nextIndex !== items.length - 1) {
            setTranslateX(itemPositions[nextIndex].start);
            setCurrentIndex(nextIndex);
          } else {
            const translateWidth = itemPositions[nextIndex].start - lastItemWidth;
            const rightEmptyWidth = screenWidth - (allItemsWidth + translateWidth + PADDING_WIDTH + CONTENT_LEFT_WIDTH);
            setTranslateX(translateWidth + rightEmptyWidth);
            setCurrentIndex(nextIndex);
          }
        } else {
          setTranslateX(itemPositions[nextIndex].start);
          setCurrentIndex(nextIndex);
        }
      // If dragged to right, next index should be to the left
      } else if (offset > 0 && currentIndex > 0) {
        const nextIndex = currentIndex - 1;
        setTranslateX(itemPositions[nextIndex].start);
        setCurrentIndex(nextIndex);
      }
    }
    const parentElement = document.getElementsByClassName(classNameToHideOverflowY);
    (parentElement[0] as HTMLElement).style.overflowY = 'scroll';
  };

  function getCurrentTranslateX() {
    return translateX + (draggingInfo?.offset ?? 0);
  }

  function getIsLastTwoItemsFitScreen() {
    const restItemsWidth = itemWidths.slice(-2).reduce((prev, curr) => prev + gap + curr);
    const restTotalWidth = PADDING_WIDTH + CONTENT_LEFT_WIDTH + restItemsWidth;
    return restTotalWidth <= screenWidth;
  }

  const onDragEnd = isMobile ? handleDragEndForMobile : handleDragEnd;
  const currentTranslateX = getCurrentTranslateX();

  function getEachItemPositions(): ItemPosition[] {
    let accumulator = 0;
    return itemWidths.map((itemWidth, i): ItemPosition => {
      if (i > 0) {
        accumulator -= gap;
      }
      const itemPosition = {
        start: accumulator,
        end: accumulator - itemWidth,
      };
      accumulator -= itemWidth;
      return itemPosition;
    });
  }

  return (
    <div
      id={id}
      ref={carouselRef}
      style={{
        cursor: draggingInfo?.dragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className='sendbird-carousel-items-wrapper'
        style={{
          transition: draggingInfo?.dragging ? 'none' : 'transform 0.5s ease',
          transform: `translateX(${currentTranslateX}px)`,
          gap: gap,
        }}
      >
        {items.map((item, index) => (
          <CarouselItem key={`${id}-${index}`} item={item} defaultWidth={defaultItemWidth + 'px'}/>
        ))}
      </div>
    </div>
  );
}

export default Carousel;
