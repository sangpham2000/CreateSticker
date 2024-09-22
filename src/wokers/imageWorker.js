import * as bodyPix from '@tensorflow-models/body-pix';

onmessage = async function(e) {
  const { imgElement, modelConfig } = e.data;
  const net = await bodyPix.load(modelConfig);
  const segmentation = await net.segmentPerson(imgElement);
  postMessage({ segmentation });
};
