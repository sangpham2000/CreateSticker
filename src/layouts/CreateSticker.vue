<template>
  <div class="sticker-creator">
    <h1 class="title">Create Sticker</h1>

    <div class="upload-area" @dragover.prevent @drop.prevent="onDrop">
      <a-upload :before-upload="beforeUpload" :show-upload-list="false">
        <a-button class="upload-button" type="primary">
          <upload-outlined />
          Upload Image
        </a-button>
      </a-upload>
      <p class="upload-hint">Drag and drop an image or click to select</p>
    </div>

    <a-spin :spinning="loading" tip="Processing image..." size="large">
      <div class="canvas-container" v-if="imageLoaded">
        <canvas
          ref="canvas"
          :width="canvasWidth"
          :height="canvasHeight"
          class="responsive-canvas"
        ></canvas>
      </div>
    </a-spin>

    <div class="controls" v-if="imageLoaded">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="12">
          <a-form-item label="Border Color">
            <a-input
              type="color"
              v-model:value="borderColor"
              :disabled="loading"
              @change="handleChange"
              class="color-picker"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="12">
          <a-form-item label="Border Size">
            <a-slider
              v-model:value="borderSize"
              :disabled="loading"
              @change="handleChange"
              :min="1"
              :max="20"
              class="custom-slider"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 16]">
        <a-col :span="24">
          <a-form-item label="Model Quality">
            <a-radio-group
              v-model:value="modelQuality"
              @change="handleChange('modelQuality')"
              class="custom-radio-group"
            >
              <a-radio-button value="fast">Fast</a-radio-button>
              <a-radio-button value="accurate">Accurate</a-radio-button>
            </a-radio-group>
          </a-form-item>
        </a-col>
      </a-row>
      <a-button type="primary" @click="saveSticker" class="save-button">
        <download-outlined />
        Save Sticker
      </a-button>
    </div>
  </div>
  <footer class="footer">
    <p>Created by Pham Thanh Sang</p>
  </footer>
</template>

<script>
import * as tf from '@tensorflow/tfjs'
import * as bodyPix from '@tensorflow-models/body-pix'

export default {
  data() {
    return {
      imageLoaded: true,
      loading: false,
      borderColor: '#ffffff',
      borderSize: 10,
      canvasWidth: 0,
      canvasHeight: 0,
      imgElement: null,
      segmentation: null,
      isDragging: false,
      lastX: 0,
      lastY: 0,
      stickerX: 0,
      stickerY: 0,
      scale: 1,
      originalWidth: 0,
      originalHeight: 0,
      modelQuality: 'accurate',
      bodyPixNet: null
    }
  },
  methods: {
    debounce(func, wait) {
      let timeout
      return (...args) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          func.apply(this, args)
        }, wait)
      }
    },
    drawCanvasDebounced() {
      this.debounce(() => {
        if (this.imageLoaded) {
          this.loading = true
          this.processImage()
        }
      }, 500)
    },
    async beforeUpload(file) {
      this.loading = true

      const reader = new FileReader()
      reader.onload = async (event) => {
        this.imgElement = new Image()
        this.imgElement.onload = async () => {
          this.originalWidth = this.imgElement.width
          this.originalHeight = this.imgElement.height
          this.setCanvasSize()
          try {
            this.processImage()
          } catch (error) {
            console.error('Error during image processing:', error)
            this.loading = false
          }
        }
        this.imgElement.src = event.target.result
      }

      reader.readAsDataURL(file)
      return false
    },

    setCanvasSize() {
      this.canvasWidth = this.originalWidth
      this.canvasHeight = this.originalHeight
    },

    async processImage() {
      if (!this.imgElement) {
        console.error('Image element is not valid.')
        this.loading = false
        return
      }

      await tf.setBackend('webgl')
      await tf.ready()

      const modelConfig =
        this.modelQuality === 'accurate'
          ? {
              architecture: 'ResNet50',
              quantBytes: 2,
              outputStride: 16,
              multiplier: 1.0
            }
          : {
              architecture: 'MobileNetV1',
              outputStride: 16,
              multiplier: 0.75,
              quantBytes: 2
            }

      const net = await bodyPix.load(modelConfig)

      try {
        console.log('Starting segmentation...')
        this.segmentation = await net.segmentPerson(this.imgElement)
        console.log('Segmentation result:', this.segmentation)
        this.drawCanvas()
        this.imageLoaded = true
      } catch (error) {
        console.error('Error during image segmentation:', error)
      } finally {
        this.loading = false
      }
    },

    drawCanvas() {
      const canvas = this.$refs.canvas
      const ctx = canvas.getContext('2d')

      ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
      ctx.fillStyle = '#f0f2f5'
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)

      ctx.drawImage(this.imgElement, 0, 0)

      const imageData = ctx.getImageData(0, 0, this.originalWidth, this.originalHeight)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        if (this.segmentation.data[i / 4] === 0) {
          data[i + 3] = 0
        }
      }

      ctx.putImageData(imageData, 0, 0)
      this.drawBorderAroundSubject()
    },

    drawBorderAroundSubject() {
      const canvas = this.$refs.canvas
      const ctx = canvas.getContext('2d')
      const width = this.originalWidth
      const height = this.originalHeight

      ctx.strokeStyle = this.borderColor
      ctx.lineWidth = this.borderSize * 2 // Tăng độ dày của viền
      ctx.globalAlpha = 0.5
      ctx.lineJoin = 'round' // Để viền có các góc mượt mà hơn

      ctx.beginPath()
      for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
          const index = i + j * width
          if (this.segmentation.data[index] > 0) {
            if (
              (i > 0 && this.segmentation.data[index - 1] === 0) ||
              (i < width - 1 && this.segmentation.data[index + 1] === 0) ||
              (j > 0 && this.segmentation.data[index - width] === 0) ||
              (j < height - 1 && this.segmentation.data[index + width] === 0)
            ) {
              ctx.strokeRect(i + this.stickerX - 0.5, j + this.stickerY - 0.5, 1, 1)
            }
          }
        }
      }
      ctx.globalAlpha = 1.0
    },
    saveSticker() {
      const canvas = this.$refs.canvas
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = 'custom-sticker.png'
      link.click()
    },

    handleChange(settingType = '') {
      if (this.imageLoaded) {
        this.loading = true
        this.processImage()
      }
      if (settingType !== 'modelQuality') {
        //    console.log('dfas')
        //   this.drawCanvasDebounced() // Vẽ lại canvas với debounce
      } else {
        //   if (this.imageLoaded) {
        //     this.loading = true
        //     this.processImage()
        //   }
      }
    }
  },

  mounted() {
    window.addEventListener('resize', this.handleResize)
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
  }
}
</script>

<style scoped>
.sticker-creator {
  width: fit-content;
  margin: 2rem auto;
  margin-top: 0;
  padding: 2rem;
  background-color: #ffffff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.title {
  font-size: 2.5rem;
  color: #1e88e5;
  margin-bottom: 2rem;
  text-align: center;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.upload-area {
  border: 2px dashed #90caf9;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  background-color: #e3f2fd;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.upload-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, #e3f2fd, #bbdefb);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.upload-area:hover::before {
  opacity: 1;
}

.upload-area:hover {
  border-color: #64b5f6;
  transform: translateY(-5px);
}

.upload-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-size: 1rem;
  font-weight: bold;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  z-index: 1;
  position: relative;
}

.upload-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.upload-hint {
  margin-top: 1rem;
  color: #546e7a;
  font-style: italic;
  font-size: 0.9rem;
  position: relative;
  z-index: 1;
}

.canvas-container {
  margin: 2rem auto;
  background-color: #f5f5f5;
  border-radius: 12px;
  overflow: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.controls {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: #f5f5f5;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.controls :deep(.ant-form-item) {
  margin-bottom: 1.5rem;
}

.controls :deep(.ant-form-item-label) {
  font-weight: bold;
  color: #37474f;
}

.color-picker {
  width: 100%;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 8px;
  overflow: hidden;
}

.custom-slider :deep(.ant-slider-rail) {
  background-color: #bbdefb;
}

.custom-slider :deep(.ant-slider-track) {
  background-color: #1e88e5;
}

.custom-slider :deep(.ant-slider-handle) {
  border-color: #1e88e5;
}

.custom-radio-group :deep(.ant-radio-button-wrapper) {
  border-radius: 8px;
  margin-right: 8px;
}

.custom-radio-group :deep(.ant-radio-button-wrapper:first-child) {
  border-radius: 8px 0 0 8px;
}

.custom-radio-group :deep(.ant-radio-button-wrapper:last-child) {
  border-radius: 0 8px 8px 0;
  margin-right: 0;
}

.custom-radio-group :deep(.ant-radio-button-wrapper-checked) {
  border-color: #1e88e5;
}

.save-button {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  font-size: 1rem;
  font-weight: bold;
  padding: 0.75rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.save-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: #546e7a;
  font-style: italic;
}

.footer p {
  margin: 0;
}

@media (max-width: 576px) {
  .sticker-creator {
    width: unset;
    padding: 1.5rem;
    margin: 1rem auto;
    max-width: 800px; /* Giữ max-width để không bị rộng quá */
  }

  .title {
    font-size: 2rem;
  }

  .upload-area {
    padding: 2rem 1rem;
  }

  .controls {
    padding: 1rem;
  }

  .upload-hint {
    font-size: 0.8rem; /* Giảm kích thước chữ hint trên mobile */
  }
}
</style>
