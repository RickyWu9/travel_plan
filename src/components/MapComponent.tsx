import React, { useEffect, useRef, useState } from 'react';
import '../styles/MapComponent.css';
// 由于无法直接安装@amap/amap-jsapi-loader包，使用动态方式加载高德地图API
// import AMapLoader from '@amap/amap-jsapi-loader';

interface MapComponentProps {
  destination: string;
  apiKey: string;
  securityKey?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({ destination, apiKey, securityKey = '' }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const scriptLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    // 重置状态
    setIsLoading(true);
    setError(null);
    
    // 检查API密钥是否存在
    if (!apiKey) {
      setError('未配置高德地图API密钥，请先在设置中配置');
      setIsLoading(false);
      return;
    }

    // 检查目标地址是否存在
    if (!destination) {
      setError('请先指定目的地');
      setIsLoading(false);
      return;
    }

    // 使用脚本标签加载高德地图API，采用回调方式确保加载完成
    const loadMapScript = () => {
      return new Promise<void>((resolve, reject) => {
        try {
          // 设置安全密钥
          if (securityKey) {
            (window as any)._AMapSecurityConfig = {
              securityJsCode: securityKey,
            };
          }
          
          // 移除已存在的script标签
          const existingScript = document.getElementById('amap-script');
          if (existingScript) {
            existingScript.remove();
          }

          // 创建新的script标签，使用回调函数方式加载
          const script = document.createElement('script');
          script.id = 'amap-script';
          script.type = 'text/javascript';
          
          // 创建唯一回调函数名
          const callbackName = 'amapLoadedCallback_' + Date.now();
          
          // 设置回调函数
          (window as any)[callbackName] = () => {
            if ((window as any).AMap && typeof (window as any).AMap === 'object') {
              scriptLoadedRef.current = true;
              // 清除回调函数引用
              delete (window as any)[callbackName];
              resolve();
            } else {
              delete (window as any)[callbackName];
              reject(new Error('高德地图API加载失败'));
            }
          };
          
          // 简化URL，不预先加载插件，只加载核心API
          script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}&callback=${callbackName}`;
          script.async = true;
          script.defer = true; // 添加defer确保脚本按顺序执行
          
          script.onerror = () => {
            // 清理回调引用
            if ((window as any)[callbackName]) {
              delete (window as any)[callbackName];
            }
            reject(new Error('高德地图API加载失败'));
          };
          
          document.body.appendChild(script);
          
          // 添加超时处理
          const timeoutId = setTimeout(() => {
            if (!scriptLoadedRef.current) {
              // 清理回调引用
              if ((window as any)[callbackName]) {
                delete (window as any)[callbackName];
              }
              reject(new Error('高德地图API加载超时'));
            }
          }, 15000); // 增加超时时间
          
          return () => clearTimeout(timeoutId);
        } catch (error) {
          reject(new Error(`加载地图时发生错误: ${error instanceof Error ? error.message : '未知错误'}`));
        }
      });
    };

    // 初始化地图核心功能
    const initMap = () => {
      try {
        if (!mapRef.current) {
          throw new Error('地图容器不可用');
        }
        
        // 确保AMap完全加载
        if (!((window as any).AMap && typeof (window as any).AMap === 'object')) {
          throw new Error('高德地图API未正确加载');
        }

        // 确保容器有尺寸
        if (mapRef.current.clientWidth === 0 || mapRef.current.clientHeight === 0) {
          console.warn('地图容器尺寸为0，尝试设置最小尺寸');
          // 强制设置最小尺寸
          mapRef.current.style.width = '100%';
          mapRef.current.style.minWidth = '300px';
          mapRef.current.style.height = '400px';
        }

        // 清除之前的地图实例，使用try-catch避免销毁错误
        if (mapInstance.current) {
          try {
            mapInstance.current.destroy();
          } catch (destroyError) {
            console.warn('销毁地图实例时出错:', destroyError);
          }
          mapInstance.current = null;
        }

        // 创建地图实例 - 使用更简单的配置避免初始化问题
        const mapOptions = {
          zoom: 15,
          center: [116.397428, 39.90923], // 默认北京坐标
          viewMode: '2D',
          resizeEnable: true // 启用响应式调整
        };
        
        console.log('创建地图实例，选项:', mapOptions);
        
        try {
          mapInstance.current = new (window as any).AMap.Map(mapRef.current, mapOptions);
        } catch (mapError) {
          console.error('创建地图实例失败:', mapError);
          throw new Error(`创建地图失败: ${mapError instanceof Error ? mapError.message : '未知错误'}`);
        }
        
        // 延迟加载插件，确保地图核心已初始化完成
        setTimeout(() => {
          loadMapPlugins();
        }, 300);
        
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '地图初始化失败';
        console.error('地图初始化错误:', errorMsg, err);
        setError(errorMsg);
        setIsLoading(false);
      }
    };

    // 加载地图插件
    const loadMapPlugins = () => {
      try {
        if (!mapInstance.current || !((window as any).AMap && (window as any).AMap.plugin)) {
          throw new Error('地图实例不可用或插件方法不存在');
        }
        
        // 一次性加载所有需要的插件
        (window as any).AMap.plugin(['AMap.Geocoder', 'AMap.ToolBar', 'AMap.Scale', 'AMap.MapType'], () => {
          try {
            // 添加控件，使用try-catch避免单个控件加载失败影响整体功能
            try {
              if (mapInstance.current && typeof mapInstance.current.addControl === 'function') {
                mapInstance.current.addControl(new (window as any).AMap.ToolBar());
                mapInstance.current.addControl(new (window as any).AMap.Scale());
                mapInstance.current.addControl(new (window as any).AMap.MapType());
              }
            } catch (controlError) {
              console.warn('添加地图控件失败，将继续执行:', controlError);
            }
            
            // 延迟执行地理编码，确保插件完全加载
            setTimeout(() => {
              performGeocoding();
            }, 300);
          } catch (pluginError) {
            console.error('加载地图插件失败:', pluginError);
            setError('加载地图功能组件失败');
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error('加载地图插件过程错误:', err);
        setError('加载地图功能组件失败');
        setIsLoading(false);
      }
    };

    // 执行地理编码
  const performGeocoding = () => {
    try {
      if (!mapInstance.current || !((window as any).AMap && (window as any).AMap.Geocoder)) {
        throw new Error('地图实例或地理编码服务不可用');
      }
      
      console.log('开始地理编码，目的地:', destination);
      console.log('API密钥状态: 已提供', !!apiKey);
      console.log('安全密钥状态: 已提供', !!securityKey);
      
      // 设置地理编码超时处理
      const geocodingTimeout = setTimeout(() => {
        console.error('地理编码请求超时');
        setError('获取地点信息超时，请检查网络连接或API密钥配置');
        setIsLoading(false);
      }, 10000); // 10秒超时
      
      // 创建地理编码实例
      const geocoder = new (window as any).AMap.Geocoder({
        extensions: 'base', // 使用基础地理编码
        city: '', // 空字符串表示全国范围内搜索
        radius: 1000 // 设置搜索半径
      });

      // 添加日志确认地理编码器已创建
      console.log('地理编码器实例已创建');
      
      // 尝试使用坐标预设作为备选方案
      const coordinatePresets: {[key: string]: [number, number]} = {
        '上海': [121.473701, 31.230416],
        '北京': [116.397428, 39.90923],
        '广州': [113.264385, 23.129163],
        '深圳': [114.057868, 22.543099]
      };

      // 检查是否有预设坐标可以直接使用
      if (coordinatePresets[destination]) {
        console.log('使用预设坐标:', destination, coordinatePresets[destination]);
        clearTimeout(geocodingTimeout);
        usePresetCoordinates(coordinatePresets[destination]);
        return;
      }
      
      // 根据地址解析坐标
      try {
        geocoder.getLocation(destination, (status: string, result: any) => {
          // 清除超时计时器
          clearTimeout(geocodingTimeout);
          
          console.log('地理编码结果:', status, result);
          
          if (status === 'complete' && result.geocodes && result.geocodes.length > 0) {
            const location = result.geocodes[0].location;
            
            console.log('获取到坐标:', location.lng, location.lat);
            
            try {
              // 检查地图实例是否仍然存在且有效
              if (mapInstance.current && typeof mapInstance.current.setCenter === 'function') {
                // 移除动画属性，使用简单的setCenter避免潜在问题
                mapInstance.current.setCenter([location.lng, location.lat]);
                
                // 创建标记点，不使用动画以避免潜在问题
                const marker = new (window as any).AMap.Marker({
                  position: [location.lng, location.lat],
                  title: destination
                });
                
                try {
                  mapInstance.current.add(marker);
                  
                  // 添加信息窗口
                  const infoWindow = new (window as any).AMap.InfoWindow({
                    content: `<div style="padding: 10px;">目的地: ${destination}</div>`,
                    offset: new (window as any).AMap.Pixel(0, -30)
                  });
                  
                  // 点击标记显示信息窗口
                  marker.on('click', () => {
                    if (mapInstance.current) {
                      infoWindow.open(mapInstance.current, marker.getPosition());
                    }
                  });
                  
                  // 自动打开信息窗口
                  if (mapInstance.current) {
                    infoWindow.open(mapInstance.current, marker.getPosition());
                  }
                } catch (markerError) {
                  console.warn('添加标记点失败:', markerError);
                }
              }
            } catch (centerError) {
              console.error('设置地图中心点失败:', centerError);
            }
            
            setIsLoading(false);
          } else {
            const errorMsg = result && result.info ? `地理编码失败: ${result.info}` : '未找到该地点，请检查目的地名称是否正确';
            console.error(errorMsg, result);
            setError(errorMsg);
            setIsLoading(false);
          }
        });
      } catch (apiCallError) {
        console.error('调用地理编码API时发生错误:', apiCallError);
        clearTimeout(geocodingTimeout);
        setError('调用地图服务时发生错误，请检查API密钥配置');
        setIsLoading(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '地理编码过程中发生错误';
      console.error(errorMsg, err);
      setError(errorMsg);
      setIsLoading(false);
    }
  };
  
  // 使用预设坐标的备选方法
  const usePresetCoordinates = (coordinates: [number, number]) => {
    try {
      if (mapInstance.current && typeof mapInstance.current.setCenter === 'function') {
        mapInstance.current.setCenter(coordinates);
        
        const marker = new (window as any).AMap.Marker({
          position: coordinates,
          title: destination
        });
        
        mapInstance.current.add(marker);
        
        const infoWindow = new (window as any).AMap.InfoWindow({
          content: `<div style="padding: 10px;">目的地: ${destination}</div>`,
          offset: new (window as any).AMap.Pixel(0, -30)
        });
        
        infoWindow.open(mapInstance.current, marker.getPosition());
      }
      setIsLoading(false);
    } catch (err) {
      console.error('使用预设坐标时发生错误:', err);
      setError('显示地图时发生错误');
      setIsLoading(false);
    }
  };

    // 加载地图
    loadMapScript()
      .then(() => {
        // 确保AMap已加载
        if ((window as any).AMap) {
          // 等待DOM更新
          setTimeout(() => {
            initMap();
          }, 200); // 增加延迟，确保DOM完全准备好
        } else {
          throw new Error('高德地图API未正确加载');
        }
      })
      .catch((err) => {
        const errorMsg = err instanceof Error ? err.message : '地图加载失败';
        console.error('地图加载过程错误:', errorMsg, err);
        setError(errorMsg);
        setIsLoading(false);
      });

    // 清理函数
    return () => {
      // 移除安全密钥配置
      if ((window as any)._AMapSecurityConfig) {
        delete (window as any)._AMapSecurityConfig;
      }
      
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, [destination, apiKey]);

  // 监听窗口大小变化，重新调整地图大小
  useEffect(() => {
    const handleResize = () => {
      if (mapInstance.current) {
        mapInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="map-container">
      {isLoading && <div className="map-loading">地图加载中...</div>}
      {error && <div className="map-error">{error}</div>}
      <div ref={mapRef} className="map" style={{ height: '100%', width: '100%' }}></div>
    </div>
  );
};

export default MapComponent;