import * as THREE from "three";
import {
  VRM,
  VRMExpressionManager,
  VRMExpressionPresetName,
} from "@pixiv/three-vrm";
import { AutoLookAt } from "./autoLookAt";
import { AutoBlink } from "./autoBlink";

/**
 * Expressionを管理するクラス
 *
 * 主に前の表情を保持しておいて次の表情を適用する際に0に戻す作業や、
 * 前の表情が終わるまで待ってから表情適用する役割を持っている。
 */
export class ExpressionController {
  private _autoLookAt: AutoLookAt;
  private _autoBlink?: AutoBlink;
  private _expressionManager?: VRMExpressionManager;
  private _currentEmotion: VRMExpressionPresetName;
  private _currentLipSync: {
    preset: VRMExpressionPresetName;
    value: number;
  } | null;
  constructor(vrm: VRM, camera: THREE.Object3D) {
    this._autoLookAt = new AutoLookAt(vrm, camera);
    this._currentEmotion = "neutral";
    this._currentLipSync = null;
    if (vrm.expressionManager) {
      this._expressionManager = vrm.expressionManager;
      this._autoBlink = new AutoBlink(vrm.expressionManager);
      console.log("VRMExpressionManager is initialized:", this._expressionManager);
    } else {
      console.warn("VRMExpressionManager is NOT found on this VRM model.");
    }
  }

  public playEmotion(preset: VRMExpressionPresetName) {
    // console.log(`[ExpressionController] Calling playEmotion with preset: ${preset}`);
    if (this._currentEmotion != "neutral") {
      this._expressionManager?.setValue(this._currentEmotion, 0);
      console.log(`[ExpressionController] Resetting ${this._currentEmotion} to 0`);
    }

    if (preset == "neutral") {
      this._autoBlink?.setEnable(true);
      this._currentEmotion = preset;
      console.log(`[ExpressionController] Set currentEmotion to neutral. AutoBlink enabled.`);
      return;
    }

    const t = this._autoBlink?.setEnable(false) || 0;
    this._currentEmotion = preset;
    console.log(`[ExpressionController] Set currentEmotion to ${preset}. AutoBlink disabled.`);
    setTimeout(() => {
      this._expressionManager?.setValue(preset, 1);
      console.log(`[ExpressionController] Applied preset ${preset} with value 1 after timeout.`);
    }, t * 1000);
  }

  public lipSync(preset: VRMExpressionPresetName, value: number) {
    if (this._currentLipSync) {
      this._expressionManager?.setValue(this._currentLipSync.preset, 0);
    }
    this._currentLipSync = {
      preset,
      value,
    };
    // console.log(`[ExpressionController] LipSync set to ${preset} with value ${value}`); // 頻繁なログなのでコメントアウト
  }

  public update(delta: number) {
    if (this._autoBlink) {
      this._autoBlink.update(delta);
    }

    if (this._currentLipSync) {
      const weight =
        this._currentEmotion === "neutral"
          ? this._currentLipSync.value * 0.5
          : this._currentLipSync.value * 0.25;
      this._expressionManager?.setValue(this._currentLipSync.preset, weight);
      // console.log(`[ExpressionController] Update: LipSync applying ${this._currentLipSync.preset} with weight ${weight}`); // 頻繁なログなのでコメントアウト
    }
    // console.log(`[ExpressionController] Update called. Delta: ${delta}`); // 頻繁なログなのでコメントアウト
  }
}
