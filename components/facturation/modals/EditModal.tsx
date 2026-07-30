'use client'

import { Btn, css } from '../ui'
import type { Vals } from '../useZemzem'

const FIELD = 'text-align:right;margin-bottom:14px'
const LBL = 'display:block;font-size:12.5px;font-weight:500;color:#6E7565;margin-bottom:5px'
const G3 = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 15px'
const G2 = 'display:grid;grid-template-columns:1fr 1fr;gap:0 15px'
const SECTION_BTN =
  'padding:14px 16px;border:1px solid #E7E3D6;border-radius:11px;background:#fff;text-align:right;font-size:13.5px;font-weight:600'
const SECTION_BTN_HOVER = 'background:#EDF0E5;border-color:#C8CEBE'
const ROW = 'display:flex;align-items:center;gap:10px;padding:3px 0;font-size:13px'
const AMOUNT = "margin-inline-start:auto;font-family:'IBM Plex Mono',monospace;font-weight:600;direction:ltr"
const CHECK = 'width:17px;height:17px;accent-color:#47593C;cursor:pointer'

const SECTIONS: { key: 'identity' | 'contact' | 'program' | 'group' | 'note' | 'firstPayment'; title: string; sub: string }[] = [
  { key: 'identity', title: 'الهوية', sub: 'الاسم والنسب معًا' },
  { key: 'contact', title: 'الهاتف', sub: 'رقم الهاتف فقط' },
  { key: 'program', title: 'البرنامج والسعر', sub: 'الفندق، الرحلة، الغرفة والتخفيض' },
  { key: 'group', title: 'المجموعة / العائلة', sub: 'إضافة، تغيير أو حذف المجموعة' },
  { key: 'note', title: 'الملاحظة', sub: 'تعديل الملاحظة فقط' },
  {
    key: 'firstPayment',
    title: 'طريقة الدفعة الأولى',
    sub: 'الطريقة وبيانات الشيك أو التحويل، دون تغيير المبلغ',
  },
]

export function EditModal({ v }: { v: Vals }) {
  const { ef, efH, eSty } = v
  const openSection = {
    identity: v.editIdentity,
    contact: v.editContact,
    program: v.editProgram,
    group: v.editGroup,
    note: v.editNote,
    firstPayment: v.editFirstPayment,
  }
  return (
    <div
      onClick={v.overlayClick}
      style={css(
        'position:fixed;inset:0;background:rgba(20,23,15,.55);z-index:110;display:flex;align-items:flex-start;justify-content:center;padding:24px;overflow-y:auto',
      )}
    >
      <div
        style={css(
          'background:#fff;border-radius:16px;width:100%;max-width:760px;box-shadow:0 20px 60px -12px rgba(0,0,0,.4);margin:auto',
        )}
      >
        <div style={css('display:flex;align-items:center;gap:12px;padding:16px 24px;border-bottom:1px solid #E7E3D6')}>
          <h2 style={css('font-size:16.5px;font-weight:600;flex:1')}>تعديل بيانات الوصل</h2>
          <Btn
            onClick={v.closeAll}
            s="width:31px;height:31px;border-radius:8px;display:grid;place-items:center;color:#6E7565"
            sh="background:#EDF0E5"
          >
            ✕
          </Btn>
        </div>
        <div style={css('padding:17px 24px;background:#F9F7F2;border-bottom:1px solid #E7E3D6')}>
          <div style={css('display:grid;grid-template-columns:repeat(4,1fr);gap:10px')}>
            <div>
              <div style={css('font-size:10.5px;color:#9CA28F')}>رقم الوصل — ثابت</div>
              <div style={css("font-family:'IBM Plex Mono',monospace;font-size:21px;font-weight:600;color:#A3801F")}>
                {v.editNum}
              </div>
            </div>
            <div>
              <div style={css('font-size:10.5px;color:#9CA28F')}>تاريخ التسجيل — ثابت</div>
              <div
                style={css(
                  "font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;direction:ltr;display:inline-block",
                )}
              >
                {v.editDate}
              </div>
            </div>
            <div>
              <div style={css('font-size:10.5px;color:#9CA28F')}>الوسيط — غير قابل للتعديل</div>
              <div style={css('font-size:13px;font-weight:600')}>{v.editRab}</div>
            </div>
            <div>
              <div style={css('font-size:10.5px;color:#9CA28F')}>مبلغ الدفعة الأولى — ثابت</div>
              <div
                style={css(
                  "font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;direction:ltr;display:inline-block",
                )}
              >
                {v.editFirstAmt}
              </div>
            </div>
          </div>
        </div>
        <div style={css('padding:20px 24px')}>
          {v.eErrShow ? (
            <div
              style={css(
                'background:#F7E8E5;color:#9C3B32;border-radius:9px;padding:10px 13px;font-size:12.5px;font-weight:500;margin-bottom:14px;text-align:right',
              )}
            >
              <b>تعذر حفظ التعديل:</b>
              <ul style={css('margin:4px 0 0;padding-inline-start:18px')}>
                {v.eErr.map((e, i) => (
                  <li key={i} style={css('margin:2px 0')}>
                    {e.m}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {v.editChooseSection ? (
            <>
              <p style={css('font-size:13px;color:#6E7565;margin-bottom:14px')}>
                اختر قسمًا واحدًا فقط. بعد حفظه يمكنك فتح التعديل مرة أخرى لاختيار قسم آخر.
              </p>
              <div style={css('display:grid;grid-template-columns:repeat(2,1fr);gap:10px')}>
                {SECTIONS.map((sec) => (
                  <Btn key={sec.key} onClick={openSection[sec.key]} s={SECTION_BTN} sh={SECTION_BTN_HOVER}>
                    <span style={css('display:block;color:#47593C')}>{sec.title}</span>
                    <small style={css('display:block;color:#6E7565;font-weight:400;margin-top:2px')}>{sec.sub}</small>
                  </Btn>
                ))}
              </div>
              <div style={css('background:#F6EEDA;border-radius:10px;padding:10px 13px;margin-top:14px;font-size:12px;color:#A3801F')}>
                الوسيط ومبالغ الدفعات غير قابلة للتعديل. الدفعات الثانية وما بعدها تبقى كما سُجلت.
              </div>
            </>
          ) : null}

          {v.editSectionChosen ? (
            <>
              <div style={css('display:flex;align-items:center;gap:10px;margin-bottom:15px;padding-bottom:9px;border-bottom:1px solid #E7E3D6')}>
                <Btn
                  onClick={v.editBack}
                  s="width:31px;height:31px;border-radius:8px;display:grid;place-items:center;border:1px solid #E7E3D6;color:#6E7565"
                  sh="background:#EDF0E5"
                >
                  ←
                </Btn>
                <div>
                  <div style={css('font-size:11px;color:#9CA28F')}>القسم المختار</div>
                  <div style={css('font-size:15px;font-weight:600;color:#47593C')}>{v.editSectionLabel}</div>
                </div>
              </div>

              {v.editIsIdentity ? (
                <div style={css(G2)}>
                  <div style={css(FIELD)}>
                    <label style={css(LBL)}>الاسم *</label>
                    <input onChange={efH.pre} style={css(eSty.pre)} value={ef.pre} />
                  </div>
                  <div style={css(FIELD)}>
                    <label style={css(LBL)}>النسب *</label>
                    <input onChange={efH.nom} style={css(eSty.nom)} value={ef.nom} />
                  </div>
                </div>
              ) : null}

              {v.editIsContact ? (
                <div style={css(FIELD)}>
                  <label style={css(LBL)}>رقم الهاتف *</label>
                  <input inputMode="numeric" onChange={efH.tel} style={css(eSty.tel + ';direction:ltr')} value={ef.tel} />
                </div>
              ) : null}

              {v.editIsProgram ? (
                <>
                  <div style={css(G3)}>
                    <div style={css(FIELD)}>
                      <label style={css(LBL)}>الفندق *</label>
                      <select onChange={efH.h} style={css(eSty.h)} value={ef.h}>
                        <option>منار الشروق</option>
                        <option>رايا مبارك</option>
                        <option>واحة احياد</option>
                      </select>
                    </div>
                    <div style={css(FIELD)}>
                      <label style={css(LBL)}>الرحلة *</label>
                      <select onChange={efH.v} style={css(eSty.v)} value={ef.v}>
                        <option>الخطوط السعودية</option>
                        <option>القطرية</option>
                      </select>
                    </div>
                    <div style={css(FIELD)}>
                      <label style={css(LBL)}>الغرفة *</label>
                      <select onChange={efH.c} style={css(eSty.c)} value={ef.c}>
                        <option>2</option>
                        <option>3</option>
                        <option>4</option>
                        <option>5</option>
                        <option>6</option>
                        <option>7</option>
                      </select>
                    </div>
                  </div>
                  <div style={css(FIELD)}>
                    <label style={css(LBL)}>التخفيض (درهم)</label>
                    <input inputMode="numeric" onChange={efH.red} style={css(eSty.red + ';direction:ltr')} value={ef.red} />
                  </div>
                  {v.editNoPrice ? (
                    <div
                      style={css(
                        'background:#F7E8E5;color:#9C3B32;border-radius:9px;padding:10px 13px;font-size:12px;font-weight:500;margin-bottom:13px',
                      )}
                    >
                      لا يوجد ثمن محدد لهذه التركيبة.
                    </div>
                  ) : null}
                  <div style={css('background:#F6EEDA;border-radius:11px;padding:13px 16px;margin-bottom:14px')}>
                    <div style={css(ROW)}>
                      <span style={css('color:#6E7565')}>الثمن الجديد</span>
                      <span style={css(AMOUNT)}>{v.editTarif}</span>
                    </div>
                    <div style={css(ROW)}>
                      <span style={css('color:#6E7565')}>التخفيض</span>
                      <span style={css(AMOUNT)}>{v.editReduction}</span>
                    </div>
                    <div
                      style={css(
                        'display:flex;align-items:center;gap:10px;padding-top:8px;margin-top:4px;border-top:1px solid #E7E3D6;font-size:15px',
                      )}
                    >
                      <span style={css('color:#6E7565')}>المبلغ المتفق عليه الجديد</span>
                      <span style={css(AMOUNT + ';font-size:17px;color:#47593C')}>{v.editConvenu}</span>
                    </div>
                    <div style={css('display:flex;align-items:center;gap:10px;padding-top:5px;font-size:12px')}>
                      <span style={css('color:#6E7565')}>المبلغ المدفوع يبقى كما هو</span>
                      <span style={css(AMOUNT)}>{v.editPaid}</span>
                    </div>
                  </div>
                </>
              ) : null}

              {v.editIsGroup ? (
                <>
                  <label style={css('display:flex;align-items:center;gap:9px;margin:4px 0 12px;font-size:13px;cursor:pointer')}>
                    <input checked={ef.grpChk} onChange={efH.grpChk} style={css(CHECK)} type="checkbox" />
                    ينتمي إلى مجموعة / عائلة
                  </label>
                  {ef.grpChk ? (
                    <div style={css(FIELD)}>
                      <label style={css(LBL)}>رمز المجموعة *</label>
                      <input onChange={efH.grp} placeholder="GRP-2027-0001" style={css(eSty.grp)} value={ef.grp} />
                    </div>
                  ) : null}
                </>
              ) : null}

              {v.editIsNote ? (
                <div style={css(FIELD)}>
                  <label style={css(LBL)}>ملاحظة</label>
                  <textarea onChange={efH.note} rows={4} style={css(eSty.note)} value={ef.note} />
                </div>
              ) : null}

              {v.editIsFirstPayment ? (
                <>
                  <div style={css('background:#EDF0E5;border-radius:10px;padding:11px 14px;margin-bottom:14px;display:flex;align-items:center;gap:10px')}>
                    <span style={css('font-size:12px;color:#6E7565')}>مبلغ الدفعة الأولى — لا يتغير</span>
                    <span
                      style={css(
                        "margin-inline-start:auto;font-family:'IBM Plex Mono',monospace;font-size:15px;font-weight:600;direction:ltr",
                      )}
                    >
                      {v.editFirstAmt}
                    </span>
                  </div>
                  <div style={css(FIELD)}>
                    <label style={css(LBL)}>طريقة الدفع *</label>
                    <select onChange={efH.mode} style={css(eSty.mode)} value={ef.mode}>
                      <option value="نقد">نقد</option>
                      <option value="شيك">شيك</option>
                      <option value="تحويل بنكي">تحويل بنكي</option>
                    </select>
                  </div>
                  {v.editPaymentDetails ? (
                    <>
                      <div style={css(G3)}>
                        <div style={css(FIELD)}>
                          <label style={css(LBL)}>{v.editPaymentRefLabel}</label>
                          <input onChange={efH.cn} style={css(eSty.cn + ';direction:ltr')} value={ef.cn} />
                        </div>
                        <div style={css(FIELD)}>
                          <label style={css(LBL)}>التاريخ *</label>
                          <input
                            inputMode="numeric"
                            onChange={efH.cd}
                            placeholder="02/07/2025"
                            style={css(eSty.cd + ';direction:ltr')}
                            value={ef.cd}
                          />
                        </div>
                        <div style={css(FIELD)}>
                          <label style={css(LBL)}>البنك *</label>
                          <input onChange={efH.cb} style={css(eSty.cb)} value={ef.cb} />
                        </div>
                      </div>
                      <label style={css('display:flex;align-items:center;gap:9px;margin:3px 0 9px;font-size:13px;cursor:pointer')}>
                        <input checked={ef.col} onChange={efH.col} style={css(CHECK)} type="checkbox" />
                        عملية جماعية — شخص واحد يدفع عن عدة أشخاص
                      </label>
                      {ef.col ? (
                        <div style={css('background:#F6EEDA;border-radius:11px;padding:13px 16px;margin-bottom:14px')}>
                          <div style={css(G2)}>
                            <div style={css('text-align:right')}>
                              <label style={css(LBL)}>الشخص الذي قام بالدفع *</label>
                              <input onChange={efH.colWho} style={css(eSty.colWho)} value={ef.colWho} />
                            </div>
                            <div style={css('text-align:right')}>
                              <label style={css(LBL)}>المبلغ الحقيقي للعملية *</label>
                              <input
                                inputMode="numeric"
                                onChange={efH.colAmt}
                                style={css(eSty.colAmt + ';direction:ltr')}
                                value={ef.colAmt}
                              />
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                  <div style={css('font-size:11.5px;color:#6E7565')}>
                    هذا التعديل يخص طريقة وبيانات الدفعة الأولى فقط. مبلغها والدفعات التالية لا تتغير.
                  </div>
                </>
              ) : null}

              <div style={css('text-align:right;margin-top:15px;padding-top:14px;border-top:1px solid #E7E3D6')}>
                <label style={css(LBL)}>سبب التعديل *</label>
                <textarea
                  onChange={efH.reason}
                  placeholder="مثال: تصحيح خطأ في الإدخال"
                  rows={2}
                  style={css(eSty.reason)}
                  value={ef.reason}
                />
              </div>
            </>
          ) : null}
        </div>
        <div style={css('display:flex;gap:9px;padding:14px 24px;border-top:1px solid #E7E3D6;background:#F9F7F2;border-radius:0 0 16px 16px')}>
          <div style={css('margin-inline-start:auto;display:flex;gap:9px')}>
            <Btn
              onClick={v.closeAll}
              s="padding:10px 16px;border-radius:9px;font-size:13px;font-weight:600;background:#fff;border:1px solid #E7E3D6"
              sh="background:#EDF0E5"
            >
              إلغاء
            </Btn>
            {v.editSectionChosen ? (
              <Btn
                onClick={v.saveEdit}
                s="padding:10px 16px;border-radius:9px;font-size:13px;font-weight:600;background:#47593C;color:#fff"
                sh="background:#2E3B27"
              >
                حفظ التعديل
              </Btn>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
